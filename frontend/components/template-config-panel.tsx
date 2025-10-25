"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ArrowLeft, CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"

interface TemplateConfigPanelProps {
  open: boolean
  templateId: string
  onBack: () => void
  onCreate: (config: any) => void
}

export function TemplateConfigPanel({ open, templateId, onBack, onCreate }: TemplateConfigPanelProps) {
  const [destinationAddress, setDestinationAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState<string>("09:00")
  const [repeatNumber, setRepeatNumber] = useState<string>("1")
  const [repeatInterval, setRepeatInterval] = useState<string>("days")

  const handleCreate = () => {
    // Combine date and time into a single Date object
    let scheduledDate = date
    if (date && time) {
      const [hours, minutes] = time.split(':').map(Number)
      scheduledDate = new Date(date)
      scheduledDate.setHours(hours, minutes, 0, 0)
    }
    
    const config = {
      templateId,
      destinationAddress,
      amount,
      date: scheduledDate,
      repeatNumber: parseInt(repeatNumber) || 1,
      repeatInterval,
      unixTimestamp: scheduledDate ? Math.floor(scheduledDate.getTime() / 1000) : null,
    }
    onCreate(config)
  }

  const isValid = destinationAddress && amount && date && time && repeatNumber && repeatInterval

  return (
    <div
      className={`fixed top-0 right-0 h-full w-[400px] bg-card border-l border-border z-[60] transform transition-transform duration-300 ease-in-out ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-border">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-semibold text-foreground">Configure Agent</h2>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Destination Address */}
          <div className="space-y-2">
            <Label htmlFor="destination">Destination Address</Label>
            <Input
              id="destination"
              placeholder="0x..."
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">The Flow address to send payments to</p>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Amount in FLOW to send</p>
          </div>

          {/* Date and Time */}
          <div className="space-y-2">
            <Label>Start Date & Time</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`flex-1 justify-start text-left font-normal ${!date && "text-muted-foreground"}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "MMM dd, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[70]" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
              </Popover>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-32"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">When to start the automated payments</p>
          </div>

          {/* Repeat Every */}
          <div className="space-y-2">
            <Label htmlFor="repeat">Repeat Every</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                value={repeatNumber}
                onChange={(e) => setRepeatNumber(e.target.value)}
                className="w-20"
                placeholder="1"
              />
              <Select value={repeatInterval} onValueChange={setRepeatInterval}>
                <SelectTrigger id="repeat" className="flex-1">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent className="z-[70]">
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">How often to repeat the payment</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <Button
            onClick={handleCreate}
            disabled={!isValid}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Create Agent
          </Button>
        </div>
      </div>
    </div>
  )
}
