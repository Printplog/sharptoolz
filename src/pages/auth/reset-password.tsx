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
import { toast } from "sonner";
import { resetPasswordConfirm } from "@/api/apiEndpoints";
import errorMessage from "@/lib/utils/errorMessage";
import { Lock } from "lucide-react";

const resetSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type ResetSchema = z.infer<typeof resetSchema>;

export default function ResetPasswordConfirm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const uid = params.get("uid") || "";
  const token = params.get("token") || "";

  const form = useForm<ResetSchema>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ResetSchema) =>
      resetPasswordConfirm({ ...data, uid, token }),
    onSuccess: () => {
      toast.success("Password has been reset successfully.");
      navigate("/auth/login");
    },
    onError: (error: Error) => {
      toast.error(errorMessage(error));
    },
  });

  const onSubmit = (values: ResetSchema) => {
    if (!uid || !token) {
      toast.error("Invalid reset link.");
      return;
    }

    mutate(values);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Reset password</h2>
        <p className="text-sm text-white/35">Enter your new password below</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-white/50 uppercase tracking-wider font-medium">
                  New password
                </FormLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
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
            {isPending ? "Resetting..." : "Reset password"}
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
