import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, BarChart3, Users, Clock, Link2, Trash2, Lock, Globe, Eye } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, Badge, Separator } from "../../components/ui/index";
import { useAuthStore } from "../../store/auth.store";
import { api } from "../../lib/api";
import { toast } from "../../components/ui/toast";
import { formatDate, copyToClipboard, timeAgo } from "../../lib/utils";

interface Poll {
  id: string;
  title: string;
  description?: string;
  isPublished: boolean;
  isClosed: boolean;
  isAnonymous: boolean;
  requireAuth: boolean;
  expiresAt?: string;
  createdAt: string;
  questions: { id: string }[];
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const { data } = await api.get("/polls/me");
      setPolls(data.rows || []);
    } catch {
      toast.error("Failed to load polls");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pollId: string) => {
    if (!confirm("Delete this poll?")) return;
    try {
      await api.delete(`/polls/${pollId}`);
      setPolls((p) => p.filter((poll) => poll.id !== pollId));
      toast.success("Poll deleted");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const handleCopyLink = (pollId: string) => {
    copyToClipboard(`${window.location.origin}/poll/${pollId}`);
    toast.success("Link copied!");
  };

  const getPollStatus = (poll: Poll) => {
    if (poll.isClosed) return { label: "Closed", variant: "secondary" as const };
    if (!poll.isPublished) return { label: "Draft", variant: "outline" as const };
    if (poll.expiresAt && new Date(poll.expiresAt) < new Date())
      return { label: "Expired", variant: "warning" as const };
    return { label: "Live", variant: "success" as const };
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            Hello, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Manage your polls and view analytics</p>
        </div>
        <Button onClick={() => navigate("/polls/create")} size="lg">
          <Plus className="h-4 w-4" /> New Poll
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Polls", value: polls.length, icon: BarChart3 },
          {
            label: "Live Polls",
            value: polls.filter((p) => p.isPublished && !p.isClosed).length,
            icon: Globe,
          },
          { label: "Drafts", value: polls.filter((p) => !p.isPublished).length, icon: Clock },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Poll list */}
      {polls.length === 0 ? (
        <Card className="p-16 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="font-semibold text-lg mb-1">No polls yet</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Create your first poll to start collecting responses
          </p>
          <Button onClick={() => navigate("/polls/create")}>
            <Plus className="h-4 w-4" /> Create poll
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => {
            const status = getPollStatus(poll);
            return (
              <Card
                key={poll.id}
                className="flex flex-col card-hover cursor-pointer group"
                onClick={() => navigate(`/polls/${poll.id}/analytics`)}
              >
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleCopyLink(poll.id)}
                      >
                        <Link2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(poll.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-base leading-snug mb-1 line-clamp-2 flex-1">
                    {poll.title}
                  </h3>
                  {poll.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {poll.description}
                    </p>
                  )}

                  <Separator className="my-3" />

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      {poll.questions?.length || 0} questions
                    </span>
                    <span className="flex items-center gap-1">
                      {poll.isAnonymous ? (
                        <Users className="h-3 w-3" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                      {poll.isAnonymous ? "Anonymous" : "Auth required"}
                    </span>
                    <span className="ml-auto">{timeAgo(poll.createdAt)}</span>
                  </div>

                  {poll.expiresAt && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Expires {formatDate(poll.expiresAt)}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
