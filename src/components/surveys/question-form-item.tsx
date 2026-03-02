"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, X } from "lucide-react"

export interface QuestionDraft {
  text: string
  type: string
  required: boolean
  options: string[]
}

interface QuestionFormItemProps {
  index: number
  question: QuestionDraft
  onChange: (q: QuestionDraft) => void
  onRemove: () => void
}

const QUESTION_TYPES = [
  { value: "TEXT", label: "Free Text" },
  { value: "RATING", label: "Rating (1-5)" },
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "YES_NO", label: "Yes / No" },
  { value: "LIKERT_SCALE", label: "Likert Scale" },
]

export function QuestionFormItem({
  index,
  question,
  onChange,
  onRemove,
}: QuestionFormItemProps) {
  function updateField<K extends keyof QuestionDraft>(
    key: K,
    value: QuestionDraft[K]
  ) {
    onChange({ ...question, [key]: value })
  }

  function addOption() {
    updateField("options", [...question.options, ""])
  }

  function updateOption(idx: number, value: string) {
    const newOptions = [...question.options]
    newOptions[idx] = value
    updateField("options", newOptions)
  }

  function removeOption(idx: number) {
    updateField(
      "options",
      question.options.filter((_, i) => i !== idx)
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="mt-1 text-xs font-medium text-slate-400">
          Q{index + 1}
        </span>
        <div className="flex-1 space-y-3">
          <Input
            value={question.text}
            onChange={(e) => updateField("text", e.target.value)}
            placeholder="Question text..."
            className="bg-white"
          />

          <div className="flex items-center gap-3">
            <Select
              value={question.type}
              onValueChange={(v) => {
                updateField("type", v)
                if (v !== "MULTIPLE_CHOICE") {
                  updateField("options", [])
                }
              }}
            >
              <SelectTrigger className="w-48 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1.5">
              <Checkbox
                id={`required-${index}`}
                checked={question.required}
                onCheckedChange={(checked) =>
                  updateField("required", checked === true)
                }
              />
              <Label
                htmlFor={`required-${index}`}
                className="text-xs text-slate-500"
              >
                Required
              </Label>
            </div>
          </div>

          {question.type === "MULTIPLE_CHOICE" && (
            <div className="space-y-2">
              <Label className="text-xs text-slate-500">Options</Label>
              {question.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="bg-white"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(i)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Option
              </Button>
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
