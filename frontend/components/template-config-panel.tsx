"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
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
  const [startNow, setStartNow] = useState(true)
  const [runIndefinitely, setRunIndefinitely] = useState(false)
  const [numRepetitions, setNumRepetitions] = useState<string>("7")

  const convertIntervalToSeconds = (number: number, interval: string): number => {
    const multipliers = {
      minutes: 60,
      hours: 3600,
      days: 86400,
      weeks: 604800,
      months: 2592000 // 30 days approximation
    }
    return number * (multipliers[interval as keyof typeof multipliers] || 86400)
  }

  const calculateEndDate = (): string => {
    if (!repeatNumber || !numRepetitions) return "Unknown"
    
    // Calculate start time
    let startTime: Date
    if (startNow) {
      startTime = new Date()
    } else {
      if (!date) return "Unknown"
      // Combine date and time for accurate calculation
      startTime = new Date(date)
      if (time) {
        const [hours, minutes] = time.split(':').map(Number)
        startTime.setHours(hours, minutes, 0, 0)
      }
    }
    
    const intervalSeconds = convertIntervalToSeconds(parseInt(repeatNumber), repeatInterval)
    const totalSeconds = intervalSeconds * parseInt(numRepetitions)
    const endDate = new Date(startTime.getTime() + totalSeconds * 1000)
    return format(endDate, "MMM dd, yyyy 'at' HH:mm")
  }

  const handleCreate = () => {
    let scheduledDate = startNow ? undefined : date
    if (!startNow && date && time) {
      const [hours, minutes] = time.split(':').map(Number)
      scheduledDate = new Date(date)
      scheduledDate.setHours(hours, minutes, 0, 0)
    }
    
    const config = {
      templateId,
      destinationAddress,
      amount: parseFloat(amount),
      timestamp: startNow ? 0 : (scheduledDate ? Math.floor(scheduledDate.getTime() / 1000) : 0),
      intervalSeconds: convertIntervalToSeconds(parseInt(repeatNumber) || 1, repeatInterval),
      maxExecutions: runIndefinitely ? null : parseInt(numRepetitions),
      priority: 1, // Medium priority (default)
      executionEffort: 1000, // Fixed default
      date: scheduledDate,
      repeatNumber: parseInt(repeatNumber) || 1,
      repeatInterval,
      numRepetitions: runIndefinitely ? null : parseInt(numRepetitions),
      runIndefinitely,
    }
    onCreate(config)
  }

  const isValid = destinationAddress && 
                amount && 
                (startNow || (date && time)) && 
                repeatNumber && 
                repeatInterval &&
                (runIndefinitely || numRepetitions)

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
            <div className="flex items-center justify-between">
              <Label>Start Date & Time</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="start-now" className="text-xs font-normal">Start Now</Label>
                <Switch id="start-now" checked={startNow} onCheckedChange={setStartNow} />
              </div>
            </div>
            {!startNow && (
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
            )}
            <p className="text-xs text-muted-foreground">
              {startNow ? "Payment will start immediately upon creation" : "When to start the automated payments"}
            </p>
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

          {/* Number of Repetitions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="repetitions">Number of Repetitions</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="indefinite" className="text-xs font-normal">Run Indefinitely</Label>
                <Switch id="indefinite" checked={runIndefinitely} onCheckedChange={setRunIndefinitely} />
              </div>
            </div>
            <Input
              id="repetitions"
              type="number"
              min="1"
              value={numRepetitions}
              onChange={(e) => setNumRepetitions(e.target.value)}
              disabled={runIndefinitely}
              placeholder="7"
            />
            <p className="text-xs text-muted-foreground">
              {runIndefinitely ? "Agent will run until manually stopped" : "Total number of times to execute the payment"}
            </p>
          </div>

          {/* Summary Section */}
          {!runIndefinitely && amount && numRepetitions && (
            <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border">
              <p className="text-xs font-medium text-muted-foreground">Summary</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-medium">{(parseFloat(amount) * parseInt(numRepetitions)).toFixed(2)} FLOW</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated End Date:</span>
                  <span className="font-medium">{calculateEndDate()}</span>
                </div>
              </div>
            </div>
          )}
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
