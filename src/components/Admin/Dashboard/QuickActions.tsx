import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Type, LayoutTemplate, Hammer, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function QuickActions() {
    return (
        <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium text-white/80">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
                <Link to="/admin/fonts">
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all gap-2 h-10">
                        <Type className="h-4 w-4 text-purple-400" />
                        Fonts
                    </Button>
                </Link>
                <Link to="/admin/templates">
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all gap-2 h-10">
                        <LayoutTemplate className="h-4 w-4 text-blue-400" />
                        Templates
                    </Button>
                </Link>
                <Link to="/admin/tools">
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all gap-2 h-10">
                        <Hammer className="h-4 w-4 text-amber-400" />
                        Tools
                    </Button>
                </Link>
                <Link to="/dashboard" target="_blank">
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all gap-2 h-10">
                        <ExternalLink className="h-4 w-4 text-green-400" />
                        Main Site
                    </Button>
                </Link>
            </CardContent>
        </Card>
    )
}
