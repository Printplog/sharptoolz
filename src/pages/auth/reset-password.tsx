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
    <div className="w-full max-w-md mx-auto py-12 px-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <h2 className="text-center text-[24px]">Reset Password</h2>

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="********"
                    className="border-white/20 bg-white/5"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-primary text-black hover:bg-primary/90"
            disabled={isPending}
          >
            {isPending ? "Resetting..." : "Reset Password"}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link
                to="/auth/login"
                className="text-primary underline hover:opacity-80"
              >
                Login
              </Link>
            </p>
          </div>
        </form>
      </Form>
    </div>
  );
}
