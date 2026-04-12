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
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import type { LoginPayload, RegisterPayload } from "@/types";
import { login, register } from "@/api/apiEndpoints";
import { toast } from "sonner";
import errorMessage from "@/lib/utils/errorMessage";
import { useAuthStore } from "@/store/authStore";
import { User, Mail, Lock } from "lucide-react";

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
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Create account</h2>
        <p className="text-sm text-white/35">Join SharpToolz to get started</p>
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
                  <FormLabel className="text-xs text-white/50 uppercase tracking-wider font-medium">
                    {f.label}
                  </FormLabel>
                  <div className="relative">
                    <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
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
                        className="border-white/10 bg-white/[0.03] pl-10 h-11 placeholder:text-white/20 focus-visible:border-[#cee88c]/30 focus-visible:ring-[#cee88c]/10"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <Button
            type="submit"
            className="w-full h-11 bg-[#cee88c] text-black font-medium hover:bg-[#cee88c]/90 transition-colors mt-2"
            disabled={isPending || loginPending}
          >
            {isPending ? "Creating account..." : loginPending ? "Signing in..." : "Create account"}
          </Button>

          {!dialog && (
            <p className="text-center text-sm text-white/35 pt-1">
              Already have an account?{" "}
              <Link
                to="/auth/login"
                className="text-[#cee88c]/80 hover:text-[#cee88c] transition-colors"
              >
                Sign in
              </Link>
            </p>
          )}
        </form>
      </Form>
    </div>
  );
}
