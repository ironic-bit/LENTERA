import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { User, LogOut, Shield, UserCircle, Users, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function UserMenu() {
  const { user, logout, userRole } = useAuth();

  if (!user) return null;

  const getRoleIcon = () => {
    switch (userRole) {
      case "admin":
        return <Shield className="w-4 h-4 text-purple-500" />;
      case "user":
        return <Users className="w-4 h-4 text-blue-500" />;
      case "viewer":
        return <Eye className="w-4 h-4 text-slate-500" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case "admin":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "user":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "viewer":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 text-white hover:bg-white/10"
        >
          <div className="bg-white/20 p-1.5 rounded-full">
            <UserCircle className="w-5 h-5" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium leading-tight">{user.nama}</p>
            <p className="text-xs text-blue-200 leading-tight capitalize">{user.role}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.nama}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
            <Badge variant="outline" className={`mt-1 w-fit ${getRoleBadgeColor()}`}>
              <span className="flex items-center gap-1">
                {getRoleIcon()}
                <span className="capitalize">{user.role}</span>
              </span>
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
          <LogOut className="w-4 h-4 mr-2" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
