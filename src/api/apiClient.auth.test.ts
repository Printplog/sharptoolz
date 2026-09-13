import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import type {InternalAxiosRequestConfig} from 'axios';
import type {User} from '@/types';
const user = {pk:1,username:'tester',email:'test@example.com'} as User;
let axios: typeof import('axios').default;
let AxiosError: typeof import('axios').AxiosError;
let api: typeof import('./apiClient').apiClient;
let auth: typeof import('@/store/authStore').useAuthStore;
let session: typeof import('@/lib/authSession');
let getCsrf: ReturnType<typeof vi.spyOn>;
let refresh: ReturnType<typeof vi.spyOn>;
function failure(status?:number, detail='Failure', config?:InternalAxiosRequestConfig) {
  return new AxiosError('Request failed',undefined,config,undefined,status ? {status,data:{detail},statusText:'Error',headers:{},config:config!} : undefined);
}
beforeEach(async()=>{
  vi.resetModules();
  const m=await import('axios');axios=m.default;AxiosError=m.AxiosError;
  api=(await import('./apiClient')).apiClient;
  auth=(await import('@/store/authStore')).useAuthStore;
  session=await import('@/lib/authSession');
  session.establishAuthenticatedSession(user);
  getCsrf=vi.spyOn(axios,'get').mockResolvedValue({data:{csrfToken:'csrf'}});
  refresh=vi.spyOn(axios,'post');
  api.defaults.adapter=async config=>{
    if (!(config as InternalAxiosRequestConfig & { _retry?: boolean })._retry) throw failure(401,'Access expired',config);
    return {status:200,statusText:'OK',headers:{},config,data:{ok:true}};
  };
});
afterEach(async()=>{
  session.expireAuthenticatedSession();
  (await import('@/lib/queryClient')).queryClient.clear();
  vi.restoreAllMocks();
});
it.each([undefined,500,503,429,403])('keeps the session after a temporary refresh failure (%s)',async status=>{
  refresh.mockRejectedValue(failure(status));
  await expect(api.get('/accounts/user/')).rejects.toBeDefined();
  expect(auth.getState().isAuthenticated).toBe(true);
  refresh.mockResolvedValue({data:{}});
  await expect(api.get('/accounts/user/')).resolves.toMatchObject({status:200});
});
it('expires the session when the server rejects the refresh cookie',async()=>{
  refresh.mockRejectedValue(failure(401));
  await expect(api.get('/accounts/user/')).rejects.toBeDefined();
  expect(auth.getState().isAuthenticated).toBe(false);
});
it('fetches fresh CSRF and retries refresh once after rotation',async()=>{
  refresh.mockRejectedValueOnce(failure(403,'CSRF validation failed: token incorrect')).mockResolvedValueOnce({data:{}});
  await expect(api.get('/accounts/user/')).resolves.toMatchObject({status:200});
  expect(refresh).toHaveBeenCalledTimes(2);
  expect(getCsrf).toHaveBeenCalledTimes(2);
  expect(auth.getState().isAuthenticated).toBe(true);
});
it('shares one refresh for concurrent requests',async()=>{
  let finish!: (value:unknown)=>void;
  refresh.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
  const results=Promise.all([api.get('/one/'),api.get('/two/')]);
  await vi.waitFor(()=>expect(refresh).toHaveBeenCalledTimes(1));
  finish({data:{}});
  expect(await results).toHaveLength(2);
  expect(refresh).toHaveBeenCalledTimes(1);
});
it('does not log out a newer login when an older refresh fails',async()=>{
  let fail!: (reason:unknown)=>void;
  refresh.mockImplementation(()=>new Promise((_,reject)=>{fail=reject;}));
  const request=api.get('/accounts/user/').catch(error=>error);
  await vi.waitFor(()=>expect(refresh).toHaveBeenCalledTimes(1));
  session.establishAuthenticatedSession({...user,pk:2});
  fail(failure(401));await request;
  expect(auth.getState().user?.pk).toBe(2);
});
it('expires the session if the refreshed request remains unauthorized',async()=>{
  refresh.mockResolvedValue({data:{}});
  api.defaults.adapter=async config=>{throw failure(401,'Unauthorized',config);};
  await expect(api.get('/accounts/user/')).rejects.toBeDefined();
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(auth.getState().isAuthenticated).toBe(false);
});
