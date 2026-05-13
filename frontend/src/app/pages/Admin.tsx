import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  Boxes,
  ExternalLink,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { AdminInstance } from "../../domain/types";
import {
  forceTerminateInstance,
  listAdminInstances,
} from "../../adapters/adminAdapter";
import {
  GRAFANA_URL,
  K8S_DASHBOARD_URL,
} from "../../adapters/monitoringAdapter";
import { useAuth } from "../contexts/AuthContext";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

export default function Admin() {
  const { logoutUser } = useAuth();
  const [instances, setInstances] = useState<AdminInstance[]>([]);
  const [terminateTarget, setTerminateTarget] = useState<AdminInstance | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const grafanaUrl = useMemo(() => GRAFANA_URL, []);
  const kubernetesUrl = useMemo(() => K8S_DASHBOARD_URL, []);

  const loadInstances = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const response = await listAdminInstances();
      setInstances(response);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load instances",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInstances();
  }, [loadInstances]);

  const handleForceTerminate = async () => {
    if (!terminateTarget) return;

    try {
      await forceTerminateInstance(terminateTarget.uuid);
      setInstances((prev) =>
        prev.filter((item) => item.uuid !== terminateTarget.uuid),
      );
      toast.success(`Instance for ${terminateTarget.username} terminated`);
      setTerminateTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Termination failed",
      );
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInstances(false);
    setRefreshing(false);
    toast.success("Instance list refreshed");
  };

  const formatRemaining = (instance: AdminInstance) => {
    const remaining = instance.expiresAt.getTime() - Date.now();
    if (remaining <= 0) return "0:00";
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const isExpiringSoon = (instance: AdminInstance) =>
    instance.expiresAt.getTime() - Date.now() < 15 * 60 * 1000;

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-red-900/30 bg-zinc-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-red-500" />
            <div>
              <h1 className="text-lg text-zinc-100">AVEP Admin</h1>
              <p className="text-xs text-zinc-500">
                Administrative Control Panel
              </p>
            </div>
          </div>
          <Button
            onClick={logoutUser}
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-zinc-100"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                Grafana Monitoring
              </CardTitle>
              <CardDescription className="text-zinc-400">
                View cluster metrics and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-zinc-700 hover:bg-zinc-600">
                <a href={grafanaUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Grafana
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-500" />
                Kubernetes Dashboard
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Manage cluster resources and pods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-zinc-700 hover:bg-zinc-600">
                <a
                  href={kubernetesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Kubernetes Dashboard
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-zinc-100">
                  Active Instances
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  {instances.length} running{" "}
                  {instances.length === 1 ? "instance" : "instances"}
                </CardDescription>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-zinc-500">Loading instances...</p>
              </div>
            ) : instances.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-500">No active instances</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400">User</TableHead>
                      <TableHead className="text-zinc-400">Task</TableHead>
                      <TableHead className="text-zinc-400 hidden lg:table-cell">
                        URL
                      </TableHead>
                      <TableHead className="text-zinc-400 hidden md:table-cell">
                        Created
                      </TableHead>
                      <TableHead className="text-zinc-400 hidden md:table-cell">
                        Expires
                      </TableHead>
                      <TableHead className="text-zinc-400">Remaining</TableHead>
                      <TableHead className="text-zinc-400 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instances.map((instance) => (
                      <TableRow
                        key={instance.uuid}
                        className="border-zinc-800 hover:bg-zinc-800/50"
                      >
                        <TableCell className="text-zinc-300">
                          {instance.username}
                        </TableCell>
                        <TableCell className="text-zinc-300">
                          {instance.taskName}
                        </TableCell>
                        <TableCell className="text-zinc-400 font-mono text-xs hidden lg:table-cell">
                          {instance.url}
                        </TableCell>
                        <TableCell className="text-zinc-400 text-sm hidden md:table-cell">
                          {formatDistanceToNow(instance.createdAt, {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell className="text-zinc-400 text-sm hidden md:table-cell">
                          {formatDistanceToNow(instance.expiresAt, {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              isExpiringSoon(instance)
                                ? "bg-yellow-900/30 text-yellow-400 border-yellow-800 font-mono"
                                : "bg-green-900/30 text-green-400 border-green-800 font-mono"
                            }
                          >
                            {formatRemaining(instance)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() => setTerminateTarget(instance)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AlertDialog
        open={!!terminateTarget}
        onOpenChange={() => setTerminateTarget(null)}
      >
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              Force Terminate Instance
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will immediately terminate the instance for user{" "}
              <span className="text-zinc-300 font-semibold">
                {terminateTarget?.username}
              </span>
              . The user will lose all progress. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceTerminate}
              className="bg-red-900 hover:bg-red-800"
            >
              Force Terminate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
