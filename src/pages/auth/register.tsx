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
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import type { LoginPayload, RegisterPayload } from "@/types";
import { login, register } from "@/api/apiEndpoints";
import { toast } from "sonner";
import errorMessage from "@/lib/utils/errorMessage";
import { useAuthStore } from "@/store/authStore";
import { User, Mail, Lock } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username is required")
      .regex(/^\S+$/, "Username cannot contain spaces"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterSchema = z.infer<typeof registerSchema>;

const fields: {
  name: keyof RegisterSchema;
  label: string;
  type?: string;
  placeholder: string;
  icon: typeof User;
}[] = [
  { name: "username", label: "Username", placeholder: "your_username", icon: User },
  { name: "email", label: "Email", type: "email", placeholder: "you@example.com", icon: Mail },
  { name: "password", label: "Password", type: "password", placeholder: "••••••••", icon: Lock },
  { name: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "••••••••", icon: Lock },
];

interface Props {
  dialog?: boolean;
}

export default function Register({ dialog = false }: Props) {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { mutate: loginMutate, isPending: loginPending } = useMutation({
    mutationFn: (data: LoginPayload) => login(data),
    onSuccess: (user) => {
      setUser(user);
      toast.success("You are logged in now....");
      navigate(-1);
    },
    onError: (error: Error) => {
      toast.error(errorMessage(error));
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: RegisterPayload) => register(data),
    onSuccess: () => {
      toast.success("Account created successfully");
      if (dialog) {
        loginMutate({
          username: form.getValues("username"),
          password: form.getValues("password"),
        });
      } else {
        navigate("/auth/login");
      }
    },
    onError: (error: Error) => {
      toast.error(errorMessage(error));
    },
  });

  const onSubmit = async (values: RegisterSchema) => {
    mutate(values);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-black tracking-tighter uppercase italic">
          Join <span className="text-[#cee88c]">SharpToolz</span>
        </h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {fields.map((f) => (
            <FormField
              key={f.name}
              control={form.control}
              name={f.name}
              render={({ field: inputField }) => (
                <FormItem>
                  <FormLabel className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">
                    {f.label}
                  </FormLabel>
                  <div className="relative">
                    <f.icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                    <FormControl>
                      <Input
                        type={f.type || "text"}
                        placeholder={f.placeholder}
                        {...inputField}
                        onChange={(e) => {
                          if (f.name === "username") {
                            const value = e.target.value.replace(/\s+/g, "");
                            inputField.onChange(value);
                          } else {
                            inputField.onChange(e);
                          }
                        }}
                        className="border-white/5 bg-white/[0.02] pl-11 h-12 rounded-full placeholder:text-white/10 focus-visible:border-[#cee88c]/30 focus-visible:ring-[#cee88c]/5 transition-all"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <div className="flex gap-3 mt-2">
            <Button
              type="submit"
              className="flex-1 h-12 bg-[#cee88c] text-black font-bold text-sm rounded-full hover:bg-[#cee88c]/90 border border-white/20 transition-all active:scale-[0.98]"
              disabled={isPending || loginPending}
            >
              {isPending ? "Creating account..." : loginPending ? "Signing in..." : "Create account"}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-12 h-12 rounded-full border border-white/20 bg-white/5 p-0 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all shrink-0"
              title="Register with Google"
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
                  text="Already have an account? Sign In"
                  icon={User}
                  href="/auth/login"
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
