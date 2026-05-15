import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Link2,
  Globe,
  Lock,
  Users,
  Clock,
  BarChart3,
  ArrowLeft,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
  Separator,
} from "../../components/ui/index";
import { api } from "../../lib/api";
import { toast } from "../../components/ui/toast";
import { formatDate, copyToClipboard } from "../../lib/utils";
import { joinPollRoom, leavePollRoom, getSocket } from "../../lib/socket";
import { cn } from "../../lib/utils";

interface OptionResult {
  optionId: string;
  text: string;
  votes: number;
  percentage: number;
}
interface QuestionResult {
  questionId: string;
  question: string;
  order: number;
  totalAnswers: number;
  options: OptionResult[];
}
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
}

export default function AnalyticsPage() {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [closing, setClosing] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);

  useEffect(() => {
    fetchData();
    setupSocket();
    return () => {
      if (pollId) leavePollRoom(pollId);
    };
  }, [pollId]);

  const fetchData = async () => {
    try {
      const [pollRes, summaryRes] = await Promise.all([
        api.get(`/polls/${pollId}`),
        api.get(`/polls/${pollId}/summary`),
      ]);
      setPoll(pollRes.data.data);
      setResults(summaryRes.data.data.results || []);
      setTotalVotes(summaryRes.data.data.totalVotes || 0);
    } catch (err: any) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    if (!pollId) return;
    const socket = getSocket();
    joinPollRoom(pollId);

    socket.on("connect", () => setLiveConnected(true));
    socket.on("disconnect", () => setLiveConnected(false));
    socket.on("joined_poll", () => setLiveConnected(true));

    // Live vote update
    socket.on(
      "vote_update",
      (data: { pollId: string; totalVotes: number; results: QuestionResult[] }) => {
        if (data.pollId === pollId) {
          setResults(data.results);
          setTotalVotes(data.totalVotes);
          toast.info("New response received!");
        }
      },
    );

    socket.on("poll_closed", ({ pollId: pid }: { pollId: string }) => {
      if (pid === pollId) setPoll((p) => (p ? { ...p, isClosed: true } : p));
    });

    setLiveConnected(socket.connected);
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await api.patch(`/polls/${pollId}/publish`);
      setPoll((p) => (p ? { ...p, isPublished: true } : p));
      toast.success("Poll is now live!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  const handleClose = async () => {
    if (!confirm("Close this poll? Respondents will no longer be able to vote.")) return;
    setClosing(true);
    try {
      await api.patch(`/polls/${pollId}/close`);
      setPoll((p) => (p ? { ...p, isClosed: true } : p));
      toast.success("Poll closed");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to close");
    } finally {
      setClosing(false);
    }
  };

  const handleCopyLink = () => {
    copyToClipboard(`${window.location.origin}/poll/${pollId}`);
    toast.success("Poll link copied!");
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const isExpired = poll?.expiresAt && new Date(poll.expiresAt) < new Date();
  const isLive = poll?.isPublished && !poll?.isClosed && !isExpired;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Back */}
      <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate("/dashboard")}>
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {poll?.isClosed && <Badge variant="secondary">Closed</Badge>}
            {!poll?.isPublished && <Badge variant="outline">Draft</Badge>}
            {isLive && <Badge variant="success">Live</Badge>}
            {isExpired && <Badge variant="warning">Expired</Badge>}
            <div
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium",
                liveConnected ? "text-emerald-600" : "text-muted-foreground",
              )}
            >
              {liveConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {liveConnected ? "Live updates" : "Offline"}
            </div>
          </div>
          <h1 className="font-display text-2xl font-semibold leading-tight">{poll?.title}</h1>
          {poll?.description && (
            <p className="text-muted-foreground text-sm mt-1">{poll.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Link2 className="h-4 w-4" /> Share
          </Button>
          {!poll?.isPublished && (
            <Button size="sm" onClick={handlePublish} loading={publishing}>
              <Globe className="h-4 w-4" /> Publish
            </Button>
          )}
          {poll?.isPublished && !poll?.isClosed && (
            <Button variant="outline" size="sm" onClick={handleClose} loading={closing}>
              <Lock className="h-4 w-4" /> Close poll
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total responses", value: totalVotes, icon: Users },
          { label: "Questions", value: results.length, icon: BarChart3 },
          { label: "Anonymous", value: poll?.isAnonymous ? "Yes" : "No", icon: Users },
          { label: "Created", value: poll ? formatDate(poll.createdAt) : "—", icon: Clock },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className="text-xl font-semibold">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <Card className="p-12 text-center">
          <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-medium">No responses yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Share your poll to start collecting responses
          </p>
          <Button variant="outline" className="mt-4" onClick={handleCopyLink}>
            <Link2 className="h-4 w-4" /> Copy poll link
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {results
            .sort((a, b) => a.order - b.order)
            .map((q, qi) => (
              <Card
                key={q.questionId}
                className="animate-fade-in"
                style={{ animationDelay: `${qi * 60}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">{q.question}</CardTitle>
                    <span className="text-sm text-muted-foreground font-mono">
                      {q.totalAnswers} {q.totalAnswers === 1 ? "response" : "responses"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {q.options
                    .sort((a, b) => b.votes - a.votes)
                    .map((opt) => (
                      <div key={opt.optionId} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{opt.text}</span>
                          <span className="text-muted-foreground font-mono">
                            {opt.votes} <span className="text-xs">({opt.percentage}%)</span>
                          </span>
                        </div>
                        <Progress value={opt.percentage} />
                      </div>
                    ))}
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Poll info footer */}
      <Card className="mt-6 p-4">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            {poll?.requireAuth ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <Users className="h-3.5 w-3.5" />
            )}
            {poll?.requireAuth ? "Login required" : "Open to all"}
          </span>
          {poll?.expiresAt && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Expires {formatDate(poll.expiresAt)}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            <button onClick={handleCopyLink} className="hover:text-primary transition-colors">
              {window.location.origin}/poll/{pollId}
            </button>
          </span>
        </div>
      </Card>
    </div>
  );
}
