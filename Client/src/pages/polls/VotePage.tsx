import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Clock, Lock, Users, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Separator,
} from "../../components/ui/index";
import { api } from "../../lib/api";
import { toast } from "../../components/ui/toast";
import { formatDate } from "../../lib/utils";
import { cn } from "../../lib/utils";

interface Option {
  id: string;
  text: string;
  votes: number;
}
interface Question {
  id: string;
  question: string;
  isRequired: boolean;
  order: number;
  options: Option[];
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
  questions: Question[];
}

export default function VotePage() {
  const { pollId } = useParams<{ pollId: string }>();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPoll();
  }, [pollId]);

  const fetchPoll = async () => {
    try {
      const { data } = await api.get(`/polls/${pollId}`);
      setPoll(data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Poll not found");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (!poll) return;
    const required = poll.questions.filter((q) => q.isRequired);
    const missing = required.filter((q) => !answers[q.id]);
    if (missing.length > 0)
      return toast.error(`Please answer: ${missing.map((q) => q.question).join(", ")}`);

    setSubmitting(true);
    try {
      const anonymousId = `anon-${Math.random().toString(36).slice(2)}-${Date.now()}`;
      await api.post(`/polls/${pollId}/vote`, {
        answers,
        anonymousId: poll.isAnonymous ? anonymousId : undefined,
      });
      setSubmitted(true);
      toast.success("Response submitted!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive/60 mb-4" />
          <h2 className="font-semibold text-xl mb-2">Poll unavailable</h2>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  const isExpired = !!poll?.expiresAt && Date.now() > new Date(poll.expiresAt).getTime();

  const canVote = poll?.isPublished && !poll?.isClosed && !isExpired;

  // ── Submitted state ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="p-12 text-center animate-scale-in">
          <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="font-display text-2xl font-semibold mb-2">Response submitted!</h2>
          <p className="text-muted-foreground">Thank you for participating in this poll.</p>
        </Card>
      </div>
    );
  }

  console.log("POLL:", poll);
  console.log("EXPIRES:", poll?.expiresAt);
  console.log("NOW:", new Date());
  console.log(
    "EXPIRED CHECK:",
    !!poll?.expiresAt && Date.now() > new Date(poll.expiresAt).getTime(),
  );
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Poll header */}
      <div className="mb-6 animate-fade-in">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {poll?.isClosed && <Badge variant="secondary">Closed</Badge>}

          {isExpired && <Badge variant="warning">Expired</Badge>}
          {poll?.isPublished && !poll?.isClosed && !isExpired && (
            <Badge variant="success">Live</Badge>
          )}
          {poll?.isAnonymous ? (
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              Anonymous
            </Badge>
          ) : (
            <Badge variant="outline">
              <Lock className="h-3 w-3 mr-1" />
              Auth required
            </Badge>
          )}
          {poll?.expiresAt && (
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              Expires {formatDate(poll.expiresAt)}
            </Badge>
          )}
        </div>
        <h1 className="font-display text-3xl font-semibold leading-tight">{poll?.title}</h1>
        {poll?.description && <p className="text-muted-foreground mt-2">{poll.description}</p>}
      </div>

      <Separator className="mb-6" />

      {/* Questions */}
      <div className="space-y-4">
        {poll?.questions
          .sort((a, b) => a.order - b.order)
          .map((q, qi) => (
            <Card
              key={q.id}
              className={cn("animate-fade-in", !canVote && "opacity-70")}
              style={{ animationDelay: `${qi * 80}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-mono text-muted-foreground mt-0.5">Q{qi + 1}</span>
                  <div>
                    <CardTitle className="text-base font-medium leading-snug">
                      {q.question}
                    </CardTitle>
                    {q.isRequired && <span className="text-xs text-destructive">* Required</span>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {q.options.map((opt) => (
                  <button
                    key={opt.id}
                    disabled={!canVote}
                    onClick={() => handleSelect(q.id, opt.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-150",
                      answers[q.id] === opt.id
                        ? "border-primary bg-primary/8 text-primary ring-1 ring-primary"
                        : "border-border hover:border-primary/40 hover:bg-accent/50",
                      !canVote && "cursor-not-allowed",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-4 w-4 rounded-full border-2 shrink-0 transition-colors",
                          answers[q.id] === opt.id
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/40",
                        )}
                      />
                      {opt.text}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}
      </div>

      {canVote ? (
        <Button className="w-full mt-6" size="lg" onClick={handleSubmit} loading={submitting}>
          Submit response
        </Button>
      ) : (
        <Card className="mt-6 p-4 text-center bg-muted/50">
          <p className="text-sm text-muted-foreground">
            {poll?.isClosed
              ? "This poll is closed."
              : isExpired
                ? "This poll has expired."
                : "This poll is not accepting responses."}
          </p>
        </Card>
      )}
    </div>
  );
}
