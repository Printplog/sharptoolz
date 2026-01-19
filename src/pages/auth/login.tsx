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
import { Eye, EyeOff } from "lucide-react"; // <-- Icon import

const loginSchema = z.object({
  username: z.string().min(3, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function Login({ dialog = false }: AuthDialogProps) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/dashboard";
  // const isAdmin = params.get("admin") === "true";
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

      // Check if user has admin role (Admin or Staff) and redirect accordingly
      if (user.role === "ZK7T-93XY" || user.role === "S9K3-41TV") {
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
    <div className="">
      <div className="">
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitLogin)} className="space-y-6">
              <h2 className="text-center text-[24px]">Login</h2>

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your_username"
                        {...field}
                        className="border-white/20 bg-white/5"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="********"
                          {...field}
                          className="border-white/20 bg-white/5 pr-10"
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-primary text-black hover:bg-primary/90"
                disabled={isPending}
              >
                {isPending ? "Logging in..." : "Login"}
              </Button>

              {!dialog && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link
                      to="/auth/register"
                      className="text-primary underline hover:opacity-80"
                    >
                      Register
                    </Link>
                  </p>
                  <p className="text-sm">
                    <Link
                      to="/auth/forgot-password"
                      className="text-primary underline hover:opacity-80"
                    >
                      Forgot your password?
                    </Link>
                  </p>
                </div>
              )}
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
