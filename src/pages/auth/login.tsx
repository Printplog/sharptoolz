import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import type { LoginPayload, AuthDialogProps } from "@/types";
import { login } from "@/api/apiEndpoints";
import { toast } from "sonner";
import errorMessage from "@/lib/utils/errorMessage";
import { useAuthStore } from "@/store/authStore";
import { useDialogStore } from "@/store/dialogStore";
import { useState } from "react";
import { isAdminOrStaff } from "@/lib/constants/roles";
import { Eye, EyeOff, User, Lock, UserPlus } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";

const loginSchema = z.object({
  username: z.string().min(3, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function Login({ dialog = false }: AuthDialogProps) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const { closeDialog } = useDialogStore();

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: LoginPayload) => login(data),
    onSuccess: (user) => {
      toast.success("Login Success");
      setUser(user);

      if (dialog) {
        closeDialog("register");
        return;
      }

      if (isAdminOrStaff(user.role)) {
        navigate("/admin/dashboard");
      } else {
        navigate(next);
      }
    },
    onError: (error: Error) => {
      toast.error(errorMessage(error));
    },
  });

  const onSubmitLogin = async (values: LoginSchema) => {
    mutate(values);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-black tracking-tighter uppercase italic">
          Sign <span className="text-[#cee88c]">In</span>
        </h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitLogin)} className="space-y-5">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">
                  Username or Email
                </FormLabel>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                  <FormControl>
                    <Input
                      placeholder="username@example.com"
                      {...field}
                      className="border-white/5 bg-white/[0.02] pl-11 h-12 rounded-full placeholder:text-white/10 focus-visible:border-[#cee88c]/30 focus-visible:ring-[#cee88c]/5 transition-all"
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">
                  Password
                </FormLabel>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...field}
                      className="border-white/5 bg-white/[0.02] pl-11 pr-11 h-12 rounded-full placeholder:text-white/10 focus-visible:border-[#cee88c]/30 focus-visible:ring-[#cee88c]/5 transition-all"
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-1">
            <Link
              to="/auth/forgot-password"
              className="text-xs font-medium text-white/30 hover:text-[#cee88c] transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <div className="flex gap-3 mt-2">
            <Button
              type="submit"
              className="flex-1 h-12 bg-[#cee88c] text-black font-bold text-sm rounded-full hover:bg-[#cee88c]/90 border border-white/20 transition-all active:scale-[0.98]"
              disabled={isPending}
            >
              {isPending ? "Signing in..." : "Sign in"}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-12 h-12 rounded-full border border-white/20 bg-white/5 p-0 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all shrink-0"
              title="Sign in with Google"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  className="fill-[#4285F4]"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  className="fill-[#34A853]"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  className="fill-[#FBBC05]"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  className="fill-[#EA4335]"
                />
              </svg>
            </Button>
          </div>

          {!dialog && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 pt-4">
                <div className="h-[1px] flex-1 bg-white/5"></div>
                <span className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">Or</span>
                <div className="h-[1px] flex-1 bg-white/5"></div>
              </div>
              <div className="text-center">
                <PremiumButton 
                  text="New? Create Account"
                  icon={UserPlus}
                  href="/auth/register"
                  variant="outline"
                  className="w-full h-12 text-xs font-bold bg-white/5 border border-white/20 hover:bg-white/10"
                  noShadow={true}
                />
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
