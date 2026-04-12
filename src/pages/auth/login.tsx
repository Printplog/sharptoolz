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
import { Eye, EyeOff, User, Lock } from "lucide-react";

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
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Sign in with Username or Email</h2>
        <p className="text-sm text-white/35">Welcome back! Sign in to your account to continue</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitLogin)} className="space-y-5">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-white/50 uppercase tracking-wider font-medium">
                  Username or Email
                </FormLabel>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                  <FormControl>
                    <Input
                      placeholder="username@example.com"
                      {...field}
                      className="border-white/10 bg-white/[0.03] pl-10 h-11 rounded-full placeholder:text-white/20 focus-visible:border-[#cee88c]/30 focus-visible:ring-[#cee88c]/10"
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
                <FormLabel className="text-xs text-white/50 uppercase tracking-wider font-medium">
                  Password
                </FormLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...field}
                      className="border-white/10 bg-white/[0.03] pl-10 pr-10 h-11 rounded-full placeholder:text-white/20 focus-visible:border-[#cee88c]/30 focus-visible:ring-[#cee88c]/10"
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-11 bg-[#cee88c] text-black font-medium rounded-full hover:bg-[#cee88c]/90 transition-colors mt-2"
            disabled={isPending}
          >
            {isPending ? "Signing in..." : "Sign in"}
          </Button>

          {!dialog && (
            <div className="flex items-center justify-between text-sm pt-1">
              <Link
                to="/auth/register"
                className="text-white/35 hover:text-[#cee88c] transition-colors"
              >
                Create account
              </Link>
              <Link
                to="/auth/forgot-password"
                className="text-white/35 hover:text-[#cee88c] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
