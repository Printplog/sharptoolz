import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter,Route,Routes} from 'react-router-dom';
import {afterEach,expect,it,vi} from 'vitest';
import {AxiosError} from 'axios';
import ProtectedLayout from './ProtectedLayout';
import {useAuthStore} from '@/store/authStore';
import type {User} from '@/types';

vi.mock('@/api/apiEndpoints',()=>({fetchCurrentUser:vi.fn()}));
afterEach(()=>{useAuthStore.getState().logout();vi.unstubAllGlobals();});
it('offers retry without logging out when the initial profile request fails temporarily',async()=>{
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
  useAuthStore.getState().setUser({pk:1,username:'tester'} as User);
  const client=new QueryClient({defaultOptions:{queries:{retry:false,retryOnMount:false}}});
  await client.fetchQuery({queryKey:['currentUser'],queryFn:()=>Promise.reject(new AxiosError('Network Error'))}).catch(()=>{});
  const container=document.createElement('div');document.body.append(container);const root=createRoot(container);
  try {
    await act(async()=>root.render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/admin']}><Routes>
      <Route path="/admin" element={<ProtectedLayout><div>Private editor</div></ProtectedLayout>}/>
      <Route path="/auth/login" element={<div>Login page</div>}/>
    </Routes></MemoryRouter></QueryClientProvider>));
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(container.textContent).toContain('Try again');
    expect(container.textContent).not.toContain('Login page');
    expect(container.textContent).not.toContain('Private editor');
  } finally {await act(async()=>root.unmount());container.remove();client.clear();}
});
