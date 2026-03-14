import React from 'react';
import { CalendarDays, Calendar, List, Plus, Edit2, Trash2, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CoePage(props) {
  const {
    coeViewMode,
    setCoeViewMode,
    openEventModal,
    events,
    eventsSorted,
    formatDateIndo,
    UserAvatar,
    currentCalendarDate,
    monthNames,
    handlePrevMonth,
    handleNextMonth,
    getFirstDayOfMonth,
    getDaysInMonth,
    calendarEventsByDate,
    holidaysByDate,
    handleOpenEventDetail,
    handleDeleteEvent,
  } = props;

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><CalendarDays className="w-6 h-6" /></div>
            Calendar of Events
          </h2>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex bg-slate-200 p-1 rounded-lg w-full md:w-auto">
              <button onClick={() => setCoeViewMode('calendar')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${coeViewMode === 'calendar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Calendar className="w-4 h-4" /> Calendar</button>
              <button onClick={() => setCoeViewMode('list')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${coeViewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><List className="w-4 h-4" /> List</button>
            </div>
            <button onClick={() => openEventModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
              <Plus className="w-4 h-4" /> Add Event
            </button>
          </div>
        </div>

        {coeViewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(!events || !Array.isArray(events) || events.length === 0) ? (
              <div className="col-span-1 md:col-span-2 p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">Belum ada event yang dijadwalkan.</div>
            ) : (
              eventsSorted.map((ev) => (
                <div key={ev.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-shadow">
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEventModal(ev)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteEvent(ev.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg mb-3 pr-16">{ev.title}</h3>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> <span className="font-semibold">{formatDateIndo(ev.startDate)}</span> {ev.endDate && ev.endDate !== ev.startDate && <span> - {formatDateIndo(ev.endDate)}</span>}</div>
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> <span>{ev.location || 'TBD'}</span></div>
                    <div className="flex items-start gap-2 pt-2"><Users className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {ev.participants && Array.isArray(ev.participants) && ev.participants.length > 0 ? ev.participants.map((p) => (
                          <span key={p} className="bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200 flex items-center gap-1.5"><UserAvatar name={p} className="w-3 h-3" />{p}</span>
                        )) : <span className="text-xs italic text-slate-400">Belum ada peserta</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">{monthNames[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}</h3>
              <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                <button onClick={handleNextMonth} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"><ChevronRight className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-bold text-xs text-slate-400 uppercase py-2">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {Array.from({ length: getFirstDayOfMonth(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth()) }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-24 md:h-32 rounded-lg bg-slate-50/50 border border-slate-100/50"></div>
              ))}
              {Array.from({ length: getDaysInMonth(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth()) }).map((_, idx) => {
                const day = idx + 1;
                const dateString = `${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvents = calendarEventsByDate.get(dateString) || [];
                const todayDate = new Date();
                const isReallyToday = day === todayDate.getDate() && currentCalendarDate.getMonth() === todayDate.getMonth() && currentCalendarDate.getFullYear() === todayDate.getFullYear();
                const holidayInfo = holidaysByDate.get(dateString);

                return (
                  <div key={day} className={`h-24 md:h-32 rounded-lg border p-1 md:p-2 flex flex-col transition-colors ${isReallyToday ? 'bg-blue-50/30 border-blue-200 ring-1 ring-blue-500' : (holidayInfo ? 'bg-red-50/40 border-red-200' : 'bg-white border-slate-200 hover:bg-slate-50')}`}>
                    <div className="flex flex-col items-center mb-1 w-full relative">
                      <div className={`text-xs font-bold w-6 h-6 flex flex-shrink-0 items-center justify-center rounded-full ${isReallyToday ? 'bg-blue-600 text-white' : (holidayInfo ? 'text-red-500' : 'text-slate-500')}`}>{day}</div>
                      {holidayInfo && <span className="text-[9px] md:text-[10px] text-red-500 font-semibold leading-tight text-center w-full truncate" title={holidayInfo.name}>{holidayInfo.name}</span>}
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {dayEvents.map((ev) => (
                        <div key={ev.id} onClick={() => handleOpenEventDetail(ev)} className="bg-blue-100 text-blue-700 text-[10px] md:text-xs px-1.5 py-1 rounded truncate cursor-pointer hover:bg-blue-200 transition-colors font-medium border border-blue-200" title={ev.title}>
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
