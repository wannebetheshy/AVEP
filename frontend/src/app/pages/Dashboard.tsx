import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Copy,
  Database,
  ExternalLink,
  Globe,
  Loader2,
  LogOut,
  Shield,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import type { Task } from "../../domain/types";
import { listAvailableTasks } from "../../adapters/tasksAdapter";
import { useAuth } from "../contexts/AuthContext";
import { useCountdown } from "../hooks/useCountdown";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Progress } from "../components/ui/progress";

const DIFFICULTY_STYLES: Record<Task["difficulty"], string> = {
  Easy: "bg-green-900/30 text-green-400 border-green-800",
  Medium: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
  Hard: "bg-red-900/30 text-red-400 border-red-800",
};

const ICONS_BY_TASK: Array<[RegExp, typeof Database]> = [
  [/sql|database/i, Database],
  [/xss|csrf/i, Globe],
  [/buffer|overflow|race/i, Shield],
];

const getTaskIcon = (taskId: string) => {
  const match = ICONS_BY_TASK.find(([pattern]) => pattern.test(taskId));
  return match?.[1] ?? Shield;
};

export default function Dashboard() {
  const {
    session,
    instance,
    logoutUser,
    deployInstance,
    extendInstance,
    terminateInstance,
    refreshInstance,
  } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [tasksError, setTasksError] = useState("");
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const countdown = useCountdown(instance?.expiresAt || null);
  const isDeploying = instance?.status === "deploying";

  useEffect(() => {
    let active = true;

    const loadTasks = async () => {
      try {
        const response = await listAvailableTasks();
        if (active) {
          setTasks(response);
        }
      } catch (error) {
        if (active) {
          setTasksError(
            error instanceof Error ? error.message : "Failed to load tasks",
          );
        }
      } finally {
        if (active) {
          setLoadingTasks(false);
        }
      }
    };

    loadTasks();
    refreshInstance();

    return () => {
      active = false;
    };
  }, [refreshInstance]);

  const handleDeploy = async (taskId: string) => {
    try {
      await deployInstance(taskId);
      toast.success("Deployment initiated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Deployment failed");
    }
  };

  const handleExtend = async () => {
    try {
      await extendInstance();
      toast.success("Instance extended by 30 minutes");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Extension failed");
    }
  };

  const handleTerminate = async () => {
    try {
      await terminateInstance();
      toast.success("Instance terminated");
      setShowTerminateDialog(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Termination failed",
      );
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("URL copied to clipboard");
    } catch {
      toast.error("Clipboard access denied");
    }
  };

  const shouldDisableDeploy = useMemo(() => !!instance, [instance]);

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-zinc-400" />
            <div>
              <h1 className="text-lg text-zinc-100">AVEP</h1>
              <p className="text-xs text-zinc-500">User Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">
              {session?.user.username}
            </span>
            <Button
              onClick={logoutUser}
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-zinc-100"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {instance && (
          <Card className="mb-8 bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-zinc-100">
                    Active Instance
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    {instance.taskName}
                  </CardDescription>
                </div>
                {isDeploying ? (
                  <Badge className="bg-blue-900/30 text-blue-400 border-blue-800">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Deploying
                  </Badge>
                ) : (
                  <Badge className="bg-green-900/30 text-green-400 border-green-800">
                    Active
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isDeploying ? (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-400">
                    Provisioning environment...
                  </p>
                  <Progress value={66} className="h-2" />
                  <p className="text-xs text-zinc-500">
                    This usually takes 2-3 minutes
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-500 mb-1">
                          Instance URL
                        </p>
                        <p className="text-sm text-zinc-300 font-mono truncate">
                          {instance.url}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(instance.url)}
                          className="text-zinc-400 hover:text-zinc-100"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                          className="text-zinc-400 hover:text-zinc-100"
                        >
                          <a
                            href={instance.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-zinc-400" />
                      <p className="text-xs text-zinc-500">Time Remaining</p>
                    </div>
                    <p className="text-2xl text-zinc-100 font-mono">
                      {countdown.formatted}
                    </p>
                    {countdown.canExtend && (
                      <Alert className="mt-3 bg-yellow-900/20 border-yellow-800">
                        <AlertDescription className="text-xs text-yellow-400">
                          Less than 15 minutes remaining. You can extend now.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleExtend}
                      disabled={!countdown.canExtend}
                      className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50"
                    >
                      Extend +30min
                    </Button>
                    <Button
                      onClick={() => setShowTerminateDialog(true)}
                      variant="destructive"
                      className="flex-1"
                    >
                      Terminate
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {!instance && (
          <>
            <div className="mb-6">
              <h2 className="text-xl text-zinc-100 mb-2">Available Tasks</h2>
              <p className="text-sm text-zinc-500">
                Select a task to deploy your practice environment
              </p>
            </div>

            {loadingTasks ? (
              <div className="text-sm text-zinc-500">Loading tasks...</div>
            ) : tasksError ? (
              <div className="text-sm text-red-400">{tasksError}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map((task) => {
                  const TaskIcon = getTaskIcon(task.id);
                  return (
                    <Card
                      key={task.id}
                      className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <TaskIcon className="w-5 h-5 text-zinc-400" />
                          <Badge className={DIFFICULTY_STYLES[task.difficulty]}>
                            {task.difficulty}
                          </Badge>
                        </div>
                        <CardTitle className="text-zinc-100 text-base">
                          {task.name}
                        </CardTitle>
                        <CardDescription className="text-zinc-400 text-sm">
                          {task.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => handleDeploy(task.id)}
                          disabled={shouldDisableDeploy}
                          className="w-full bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50"
                        >
                          Deploy
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {instance && instance.status === "active" && (
          <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
            <p className="text-xs text-zinc-500">
              Only one instance per user. Terminate current instance to deploy a
              different task.
            </p>
          </div>
        )}
      </main>

      <AlertDialog
        open={showTerminateDialog}
        onOpenChange={setShowTerminateDialog}
      >
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              Terminate Instance
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will immediately terminate your active environment. All
              progress will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTerminate}
              className="bg-red-900 hover:bg-red-800"
            >
              Terminate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
