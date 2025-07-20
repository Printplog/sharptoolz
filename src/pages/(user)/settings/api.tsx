import { useNavigate } from "react-router-dom"

export default function Api() {
    const navigate = useNavigate()
  return (
    <div className="h-[60vh] flex flex-col justify-center items-center gap-2">
        <h2 className="">Api is coming soon...</h2>
        <button onClick={() => navigate(-1)} className="underline text-white/70 cursor-pointer">Go back</button>
    </div>
  )
}
