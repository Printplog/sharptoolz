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
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import errorMessage from "@/lib/utils/errorMessage";
import { forgotPassword } from "@/api/apiEndpoints";
import { Mail, ArrowLeft } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";

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
      <div className="space-y-1">
        <h2 className="text-3xl font-black tracking-tighter uppercase italic">
          Reset <span className="text-[#cee88c]">Password</span>
        </h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">
                  Email address
                </FormLabel>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                      className="border-white/5 bg-white/[0.02] pl-11 h-12 rounded-full placeholder:text-white/10 focus-visible:border-[#cee88c]/30 focus-visible:ring-[#cee88c]/5 transition-all"
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 mt-2">
            <PremiumButton 
              text="I remember now"
              icon={ArrowLeft}
              href="/auth/login"
              variant="outline"
              className="flex-1 h-12 text-sm font-bold bg-white/5 border border-white/20 hover:bg-white/10"
              noShadow={true}
              iconRotation={0}
            />

            <Button
              type="submit"
              className="flex-1 h-12 bg-[#cee88c] text-black font-bold text-sm rounded-full hover:bg-[#cee88c]/90 border border-white/20 transition-all active:scale-[0.98]"
              disabled={isPending}
            >
              {isPending ? "Sending..." : "Send reset link"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
