import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="text-center">
        <FileQuestion className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
        <h1 className="text-4xl text-zinc-100 mb-2">404</h1>
        <p className="text-lg text-zinc-400 mb-6">Page not found</p>
        <p className="text-sm text-zinc-500 mb-8 max-w-md">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button asChild className="bg-zinc-700 hover:bg-zinc-600">
          <Link to="/login">
            <Home className="w-4 h-4 mr-2" />
            Return to Login
          </Link>
        </Button>
      </div>
    </div>
  );
}
