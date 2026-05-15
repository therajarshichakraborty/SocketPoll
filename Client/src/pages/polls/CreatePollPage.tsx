import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Input,
  Textarea,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from "../../components/ui/index";
import { api } from "../../lib/api";
import { toast } from "../../components/ui/toast";
import { cn } from "../../lib/utils";

interface OptionField {
  text: string;
}
interface QuestionField {
  question: string;
  isRequired: boolean;
  options: OptionField[];
  collapsed: boolean;
}

export default function CreatePollPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [requireAuth, setRequireAuth] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [questions, setQuestions] = useState<QuestionField[]>([
    { question: "", isRequired: true, options: [{ text: "" }, { text: "" }], collapsed: false },
  ]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: "", isRequired: true, options: [{ text: "" }, { text: "" }], collapsed: false },
    ]);
  };

  const removeQuestion = (qi: number) => {
    if (questions.length === 1) return toast.error("At least one question required");
    setQuestions(questions.filter((_, i) => i !== qi));
  };

  const updateQuestion = (qi: number, field: Partial<QuestionField>) => {
    setQuestions(questions.map((q, i) => (i === qi ? { ...q, ...field } : q)));
  };

  const addOption = (qi: number) => {
    if (questions[qi].options.length >= 10) return toast.error("Max 10 options");
    updateQuestion(qi, { options: [...questions[qi].options, { text: "" }] });
  };

  const removeOption = (qi: number, oi: number) => {
    if (questions[qi].options.length <= 2) return toast.error("At least 2 options required");
    updateQuestion(qi, { options: questions[qi].options.filter((_, i) => i !== oi) });
  };

  const updateOption = (qi: number, oi: number, text: string) => {
    const opts = questions[qi].options.map((o, i) => (i === oi ? { text } : o));
    updateQuestion(qi, { options: opts });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 5) return toast.error("Title must be at least 5 characters");
    for (const q of questions) {
      if (!q.question.trim()) return toast.error("All questions must have text");
      if (q.options.some((o) => !o.text.trim())) return toast.error("All options must have text");
    }

    setLoading(true);
    try {
      const { data } = await api.post("/polls", {
        title: title.trim(),
        description: description.trim() || undefined,
        isAnonymous,
        requireAuth,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        questions: questions.map((q, qi) => ({
          question: q.question.trim(),
          isRequired: q.isRequired,
          order: qi,

          options: q.options.map((o, oi) => ({
            text: o.text.trim(),
            order: oi,
          })),
        })),
      });

      await api.patch(`/polls/${data.data.id}/publish`);
      toast.success("Poll created!");
      navigate(`/polls/${data.data.id}/analytics`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create poll");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate("/dashboard")}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold">Create a poll</h1>
        <p className="text-muted-foreground mt-1">Build your poll and share it with the world</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Poll settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Poll details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                placeholder="What do you want to ask?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                required
              />
              <p className="text-xs text-muted-foreground text-right">{title.length}/120</p>
            </div>
            <div className="space-y-1.5">
              <Label>
                Description <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                placeholder="Add context for your respondents..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  Expires at <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>
            <Separator />
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm font-medium">Anonymous responses</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={requireAuth}
                  onChange={(e) => setRequireAuth(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm font-medium">Require login to vote</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((q, qi) => (
            <Card key={qi} className={cn("transition-all", q.collapsed && "opacity-80")}>
              <CardContent className="p-5">
                {/* Question header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0 mt-1.5">
                    {qi + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder={`Question ${qi + 1}`}
                      value={q.question}
                      onChange={(e) => updateQuestion(qi, { question: e.target.value })}
                      className="font-medium"
                    />
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={q.isRequired}
                        onChange={(e) => updateQuestion(qi, { isRequired: e.target.checked })}
                        className="h-3.5 w-3.5 rounded accent-primary"
                      />
                      <span className="text-xs text-muted-foreground">Required</span>
                    </label>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuestion(qi, { collapsed: !q.collapsed })}
                    >
                      {q.collapsed ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeQuestion(qi)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Options */}
                {!q.collapsed && (
                  <div className="ml-10 space-y-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-border shrink-0" />
                        <Input
                          placeholder={`Option ${oi + 1}`}
                          value={opt.text}
                          onChange={(e) => updateOption(qi, oi, e.target.value)}
                          className="h-9 text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeOption(qi, oi)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary ml-4"
                      onClick={() => addOption(qi)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add option
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed"
          onClick={addQuestion}
        >
          <Plus className="h-4 w-4" /> Add question
        </Button>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/dashboard")}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" size="lg" loading={loading}>
            Create poll
          </Button>
        </div>
      </form>
    </div>
  );
}
