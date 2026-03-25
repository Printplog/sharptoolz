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
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import errorMessage from "@/lib/utils/errorMessage";
import { forgotPassword } from "@/api/apiEndpoints";
import { Mail } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ForgotPasswordSchema) => forgotPassword(data),
    onSuccess: () => {
      toast.success("Password reset link sent. Check your email.");
    },
    onError: (error: Error) => {
      toast.error(errorMessage(error));
    },
  });

  const onSubmit = (values: ForgotPasswordSchema) => {
    mutate(values);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Forgot password?</h2>
        <p className="text-sm text-white/35">We'll send you a link to reset it</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-white/50 uppercase tracking-wider font-medium">
                  Email address
                </FormLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                      className="border-white/10 bg-white/[0.03] pl-10 h-11 placeholder:text-white/20 focus-visible:border-[#cee88c]/30 focus-visible:ring-[#cee88c]/10"
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-11 bg-[#cee88c] text-black font-medium hover:bg-[#cee88c]/90 transition-colors mt-2"
            disabled={isPending}
          >
            {isPending ? "Sending..." : "Send reset link"}
          </Button>

          <p className="text-center text-sm text-white/35 pt-1">
            Remember your password?{" "}
            <Link
              to="/auth/login"
              className="text-[#cee88c]/80 hover:text-[#cee88c] transition-colors"
            >
              Sign in
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
}
