import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar, ChevronLeft, ChevronRight, Download, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import jsPDF from "jspdf";

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvent?: boolean;
  eventName?: string;
}

interface CalendarEvent {
  date: Date;
  name: string;
}

interface CalendarSettings {
  year: number;
  month: number;
  startDay: 0 | 1 | 6; // 0 = Sunday, 1 = Monday, 6 = Saturday
  showWeekNumbers: boolean;
  theme: 'minimal' | 'classic' | 'colorful';
  headerColor: string;
  weekdayColor: string;
  highlightColor: string;
  todayColor: string;
}

export default function CalendarGenerator() {
  const today = new Date();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [newEventName, setNewEventName] = useState<string>("");
  const [newEventDate, setNewEventDate] = useState<string>(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  );
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const calendarRef = useRef<HTMLDivElement>(null);
  
  const defaultSettings: CalendarSettings = {
    year: currentYear,
    month: currentMonth,
    startDay: 0, // Start on Sunday
    showWeekNumbers: false,
    theme: 'minimal',
    headerColor: '#3b82f6', // blue-500
    weekdayColor: '#6b7280', // gray-500
    highlightColor: '#f3f4f6', // gray-100
    todayColor: '#dbeafe', // blue-100
  };
  
  const [settings, setSettings] = useState<CalendarSettings>(defaultSettings);
  
  // Month names for display
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Day names with different start days
  const getDayNames = (startDay: number): string[] => {
    const standardDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    if (startDay === 0) return standardDays;
    if (startDay === 1) return [...standardDays.slice(1), standardDays[0]];
    if (startDay === 6) return [standardDays[6], ...standardDays.slice(0, 6)];
    
    return standardDays;
  };

  const getCalendarDays = (year: number, month: number, startDay: number): CalendarDay[][] => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Adjust the first day of week based on startDay setting
    let dayOfWeekStart = firstDayOfMonth.getDay() - startDay;
    if (dayOfWeekStart < 0) dayOfWeekStart += 7;
    
    const days: CalendarDay[] = [];
    
    // Add days from previous month
    const previousMonth = month === 0 ? 11 : month - 1;
    const previousMonthYear = month === 0 ? year - 1 : year;
    const lastDayOfPreviousMonth = new Date(previousMonthYear, previousMonth + 1, 0).getDate();
    
    for (let i = dayOfWeekStart - 1; i >= 0; i--) {
      days.push({
        date: lastDayOfPreviousMonth - i,
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    // Add days from current month
    const todayObj = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = 
        i === todayObj.getDate() && 
        month === todayObj.getMonth() && 
        year === todayObj.getFullYear();
      
      // Check if this date has an event
      const dateObj = new Date(year, month, i);
      const matchingEvent = events.find(event => 
        event.date.getDate() === dateObj.getDate() &&
        event.date.getMonth() === dateObj.getMonth() &&
        event.date.getFullYear() === dateObj.getFullYear()
      );
      
      days.push({
        date: i,
        isCurrentMonth: true,
        isToday,
        hasEvent: !!matchingEvent,
        eventName: matchingEvent?.name
      });
    }
    
    // Add days from next month
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;
    const daysNeeded = 42 - days.length; // Always show 6 weeks
    
    for (let i = 1; i <= daysNeeded; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    // Group days into weeks
    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    return weeks;
  };
  
  const handleMonthChange = (value: string) => {
    setCurrentMonth(parseInt(value, 10));
    setSettings(prev => ({ ...prev, month: parseInt(value, 10) }));
  };
  
  const handleYearChange = (value: string) => {
    setCurrentYear(parseInt(value, 10));
    setSettings(prev => ({ ...prev, year: parseInt(value, 10) }));
  };
  
  const addEvent = () => {
    if (!newEventName || !newEventDate) return;
    
    const eventDate = new Date(newEventDate);
    
    setEvents(prev => [
      ...prev,
      { date: eventDate, name: newEventName }
    ]);
    
    setNewEventName("");
  };
  
  const removeEvent = (index: number) => {
    setEvents(prev => prev.filter((_, i) => i !== index));
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    let newMonth = currentMonth;
    let newYear = currentYear;
    
    if (direction === 'prev') {
      if (currentMonth === 0) {
        newMonth = 11;
        newYear = currentYear - 1;
      } else {
        newMonth = currentMonth - 1;
      }
    } else {
      if (currentMonth === 11) {
        newMonth = 0;
        newYear = currentYear + 1;
      } else {
        newMonth = currentMonth + 1;
      }
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSettings(prev => ({
      ...prev,
      month: newMonth,
      year: newYear
    }));
  };
  
  const updateSettings = (newSettings: Partial<CalendarSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  const downloadPDF = () => {
    if (calendarRef.current) {
      const element = calendarRef.current;
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.text(`${monthNames[currentMonth]} ${currentYear}`, 149, 20, { align: 'center' });
      
      // Get the table
      const table = element.querySelector('table');
      
      if (table) {
        // Get the positions
        const width = doc.internal.pageSize.getWidth();
        const height = doc.internal.pageSize.getHeight();
        
        const opts = {
          html: table,
          x: 10,
          y: 30,
          width: width - 20,
          windowWidth: 1000
        };
        
        // @ts-ignore: The type definition is incomplete for html method
        doc.html(opts, {
          callback: function() {
            // Add events if any
            if (events.length > 0) {
              const eventsStartY = height - 60;
              
              doc.setFont("helvetica", "bold");
              doc.setFontSize(14);
              doc.text("Events:", 10, eventsStartY);
              
              doc.setFont("helvetica", "normal");
              doc.setFontSize(12);
              
              events.forEach((event, index) => {
                const eventDate = `${event.date.getDate()}/${event.date.getMonth() + 1}/${event.date.getFullYear()}`;
                doc.text(`${eventDate}: ${event.name}`, 10, eventsStartY + 10 + (index * 8));
              });
            }
            
            doc.save(`calendar-${monthNames[currentMonth].toLowerCase()}-${currentYear}.pdf`);
          }
        });
      }
    }
  };
  
  // Generate week numbers for the calendar
  const getWeekNumber = (d: Date): number => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  };
  
  // Apply theme styles
  const getThemeStyles = () => {
    const { theme } = settings;
    
    switch (theme) {
      case 'classic':
        return {
          tableClass: "border-collapse border border-gray-300",
          headerClass: "bg-blue-500 text-white py-2",
          weekdayClass: "bg-gray-100 text-gray-700 py-1",
          dayCellClass: "border border-gray-300 p-2 h-20 w-20 align-top",
          todayClass: "bg-blue-100"
        };
      case 'colorful':
        return {
          tableClass: "border-collapse rounded-lg overflow-hidden",
          headerClass: "bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3",
          weekdayClass: "bg-gradient-to-r from-purple-100 to-pink-100 text-gray-800 py-2",
          dayCellClass: "border border-purple-100 p-2 h-20 w-20 align-top transition-all hover:bg-pink-50",
          todayClass: "bg-gradient-to-r from-yellow-100 to-amber-100"
        };
      case 'minimal':
      default:
        return {
          tableClass: "border-collapse",
          headerClass: "border-b text-primary py-2",
          weekdayClass: "text-muted-foreground py-1",
          dayCellClass: "border-t border-l p-2 h-20 w-20 align-top last:border-r first:border-l-0",
          todayClass: "bg-primary/5"
        };
    }
  };
  
  const themeStyles = getThemeStyles();
  const calendarDays = getCalendarDays(settings.year, settings.month, settings.startDay);
  const dayNames = getDayNames(settings.startDay);
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Calendar Generator</h1>
      
      <div className="flex flex-col-reverse lg:flex-row gap-6">
        <div className="lg:w-2/3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Calendar Preview
                </div>
              </CardTitle>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={downloadPDF}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Calendar Settings</SheetTitle>
                      <SheetDescription>
                        Customize your calendar appearance and functionality
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                      <div className="space-y-2">
                        <Label>Start day of week</Label>
                        <RadioGroup 
                          defaultValue={settings.startDay.toString()}
                          onValueChange={(value) => updateSettings({ startDay: parseInt(value) as 0 | 1 | 6 })}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="0" id="sunday" />
                            <Label htmlFor="sunday">Sunday</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1" id="monday" />
                            <Label htmlFor="monday">Monday</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="6" id="saturday" />
                            <Label htmlFor="saturday">Saturday</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Theme</Label>
                        <RadioGroup 
                          defaultValue={settings.theme}
                          onValueChange={(value) => updateSettings({ theme: value as 'minimal' | 'classic' | 'colorful' })}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="minimal" id="minimal" />
                            <Label htmlFor="minimal">Minimal</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="classic" id="classic" />
                            <Label htmlFor="classic">Classic</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="colorful" id="colorful" />
                            <Label htmlFor="colorful">Colorful</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="weekNumbers" 
                            checked={settings.showWeekNumbers}
                            onChange={(e) => updateSettings({ showWeekNumbers: e.target.checked })}
                            className="rounded" 
                          />
                          <Label htmlFor="weekNumbers">Show week numbers</Label>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Select
                    value={currentMonth.toString()}
                    onValueChange={handleMonthChange}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthNames.map((month, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Select
                    value={currentYear.toString()}
                    onValueChange={handleYearChange}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 20 }, (_, i) => today.getFullYear() - 5 + i).map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div 
                ref={calendarRef}
                className="overflow-x-auto"
              >
                <table className={`w-full ${themeStyles.tableClass}`}>
                  <thead>
                    <tr>
                      <th 
                        colSpan={settings.showWeekNumbers ? 8 : 7} 
                        className={`text-center text-xl font-bold ${themeStyles.headerClass}`}
                        style={{ color: settings.theme === 'minimal' ? settings.headerColor : undefined }}
                      >
                        {monthNames[settings.month]} {settings.year}
                      </th>
                    </tr>
                    <tr>
                      {settings.showWeekNumbers && <th className={themeStyles.weekdayClass}>Wk</th>}
                      {dayNames.map(day => (
                        <th 
                          key={day} 
                          className={`text-center ${themeStyles.weekdayClass}`}
                          style={{ color: settings.theme === 'minimal' ? settings.weekdayColor : undefined }}
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calendarDays.map((week, weekIndex) => (
                      <tr key={weekIndex}>
                        {settings.showWeekNumbers && (
                          <td className="text-center text-xs text-gray-500 border py-1">
                            {getWeekNumber(
                              new Date(settings.year, settings.month, week.find(day => day.isCurrentMonth)?.date || 1)
                            )}
                          </td>
                        )}
                        {week.map((day, dayIndex) => (
                          <td 
                            key={dayIndex}
                            className={`
                              ${themeStyles.dayCellClass}
                              ${!day.isCurrentMonth ? 'text-gray-400' : ''}
                              ${day.isToday ? themeStyles.todayClass : ''}
                            `}
                            style={day.isToday && settings.theme === 'minimal' ? { backgroundColor: settings.todayColor } : undefined}
                          >
                            <div className="flex justify-between">
                              <span className={`inline-block h-6 w-6 text-center ${day.hasEvent ? 'bg-primary text-white rounded-full' : ''}`}>
                                {day.date}
                              </span>
                            </div>
                            {day.hasEvent && (
                              <div className="mt-1 text-xs overflow-hidden whitespace-nowrap text-ellipsis bg-primary/10 p-1 rounded">
                                {day.eventName}
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:w-1/3">
          <Tabs defaultValue="events">
            <TabsList className="w-full">
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="current">Current Events</TabsTrigger>
            </TabsList>
            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle>Add Event</CardTitle>
                  <CardDescription>
                    Add events to display on your calendar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="event-date">Date</Label>
                      <Input
                        id="event-date"
                        type="date"
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-name">Event Name</Label>
                      <Input
                        id="event-name"
                        placeholder="Birthday, Meeting, etc."
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={addEvent}
                      className="w-full"
                      disabled={!newEventName || !newEventDate}
                    >
                      Add Event
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="current">
              <Card>
                <CardHeader>
                  <CardTitle>Current Events</CardTitle>
                  <CardDescription>
                    Manage events on your calendar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No events added yet. Add some events to see them here.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {events.map((event, index) => (
                        <li key={index} className="flex justify-between items-center p-2 rounded bg-muted">
                          <div>
                            <p className="font-medium">{event.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {event.date.toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEvent(index)}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}