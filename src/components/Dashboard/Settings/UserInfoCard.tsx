import { Card, CardContent } from "@/components/ui/card"
import { Mail, User,  } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
 

export default function UserInfoCard() {
     const { user } = useAuthStore()
  return (
    <Card className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-lg backdrop-blur-sm">
      <CardContent className="">
        <div className="flex items-center justify-between">
          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="w-15 h-15 bg-[#cee88c]/20 rounded-full flex items-center justify-center border border-[#cee88c]/30">
              <User className="w-6 h-6 text-[#cee88c]" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#cee88c]" />
                <span className="font-medium ">{user?.username}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#cee88c]/70" />
                <span className="text-sm text-white/80">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          {/* <Button
            variant="outline"
            size="icon"
            className=""
          >
            <Edit3 className="w-4 h-4" />
          </Button> */}
        </div>
      </CardContent>
    </Card>
  )
}