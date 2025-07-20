import { useEffect, useState } from "react"
import { CustomDialog } from "@/components/ui/CustomDialog"
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Eye, EyeOff } from "lucide-react"

// ✅ Validation schema
const schema = z
  .object({
    current_password: z.string().min(6, "Required"),
    new_password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "One uppercase required")
      .regex(/[0-9]/, "One number required"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })

type FormValues = z.infer<typeof schema>

export default function ChangePassword() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  })

  useEffect(() => {
    form.reset({
        current_password: "",
        new_password: "",
        confirm_password: "",
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [visible, setVisible] = useState({
    current_password: false,
    new_password: false,
    confirm_password: false,
  })

  const toggleVisibility = (field: keyof FormValues) => {
    setVisible((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const fields: {
    name: keyof FormValues
    label: string
    placeholder: string
  }[] = [
    {
      name: "current_password",
      label: "Current Password",
      placeholder: "Enter current password",
    },
    {
      name: "new_password",
      label: "New Password",
      placeholder: "Enter new password",
    },
    {
      name: "confirm_password",
      label: "Confirm Password",
      placeholder: "Confirm new password",
    },
  ]

  const onSubmit = (values: FormValues) => {
    console.log("Submitted:", values)
    // ✅ Call your API here
  }

  return (
    <CustomDialog dialogName="change-password">
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            {fields.map(({ name, label, placeholder }) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={visible[name] ? "text" : "password"}
                          placeholder={placeholder}
                          {...field}
                          className="border-white/10 focus-visible:border-white/10 focus-visible:ring-white/20"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                          onClick={() => toggleVisibility(name)}
                        >
                          {visible[name] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <Button type="submit" className="w-full">
              Change Password
            </Button>
          </form>
        </Form>
      </DialogContent>
    </CustomDialog>
  )
}
