import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Link, useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import type { RegisterPayload } from "@/types"
import { register } from "@/api/apiEndpoints"
import { toast } from "sonner"
import errorMessage from "@/lib/utils/errorMessage"

const registerSchema = z
  .object({
    username: z.string().min(3, "Username is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type RegisterSchema = z.infer<typeof registerSchema>

const fields: {
  name: keyof RegisterSchema
  label: string
  type?: string
  placeholder: string
}[] = [
  {
    name: "username",
    label: "Username",
    placeholder: "your_username",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "you@example.com",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "********",
  },
  {
    name: "confirmPassword",
    label: "Confirm Password",
    type: "password",
    placeholder: "********",
  },
]

export default function Register() {
  const navigate = useNavigate()

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: RegisterPayload) => register(data),
    onSuccess: () => {
        toast.success("Account created successfully")
        navigate("/auth/login")
    },
    onError: (error: Error) => {
        toast.error(errorMessage(error))
    }
  })
 
  const onSubmit = async (values: RegisterSchema) => {
    mutate(values)
  }

  return (
    <div className="">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <h2 className="text-center text-[24px]">Register</h2>

          {fields.map((field) => (
            <FormField
              key={field.name}
              control={form.control}
              name={field.name}
              render={({ field: inputField }) => (
                <FormItem>
                  <FormLabel>{field.label}</FormLabel>
                  <FormControl>
                    <Input
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      {...inputField}
                      className="border-white/20 bg-white/5"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <Button
            type="submit"
            className="w-full bg-primary text-black hover:bg-primary/90"
            disabled={isPending}
          >
            {isPending ? "Creating account..." : "Register"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth/login" className="text-primary underline hover:opacity-80">
              Login
            </Link>
          </div>
        </form>
      </Form>
    </div>
  )
}
