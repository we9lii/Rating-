import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Task, TaskStatus, WeeklyReport } from '../types';
import { getCurrentWeekId, getPreviousWeekId, getWeekDateRange, formatDate } from '../utils/date';
import { getReportByWeekId, getPreviousReport, saveReport } from '../utils/storage';
import { calculateMetrics } from '../utils/metrics';
import { Plus, Trash2, CheckCircle, AlertCircle, ArrowRight, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function ReportForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentWeekId = getCurrentWeekId();
  const prevWeekId = getPreviousWeekId();
  const { start, end } = getWeekDateRange();

  const [report, setReport] = useState<WeeklyReport>({
    id: uuidv4(),
    employeeId: user.id,
    employeeName: user.name,
    weekId: currentWeekId,
    weekStartDate: start,
    weekEndDate: end,
    previousWeekTasks: [],
    currentWeekTasks: [],
    isSubmitted: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if current week report already exists
    const existingReport = getReportByWeekId(user.id, currentWeekId);
    
    if (existingReport) {
      if (existingReport.isSubmitted) {
        navigate('/history'); // Redirect if already submitted
        return;
      }
      setReport({
        ...existingReport,
        previousWeekTasks: existingReport.previousWeekTasks || [],
        currentWeekTasks: existingReport.currentWeekTasks || []
      });
    } else {
      // Initialize new report with previous week's tasks
      const prevReport = getPreviousReport(user.id, currentWeekId);
      if (prevReport && prevReport.currentWeekTasks && prevReport.currentWeekTasks.length > 0) {
        // Deep copy tasks to avoid reference issues and reset evaluation fields
        const tasksToEvaluate: Task[] = prevReport.currentWeekTasks.map(t => ({
          ...t,
          status: 'pending',
          evaluationScore: undefined,
          reasonNotCompleted: undefined,
        }));
        
        setReport(prev => ({
          ...prev,
          previousWeekTasks: tasksToEvaluate,
        }));
      }
    }
    setIsLoading(false);
  }, [currentWeekId, navigate, user.id]);

  // Handlers for Previous Week Tasks Evaluation
  const handleAddPrevTask = () => {
    const newTask: Task = {
      id: uuidv4(),
      name: '',
      importance: 5,
      status: 'completed', // Default to completed since it's an accomplished task
      evaluationScore: 10,
      isUnplanned: true,
    };
    setReport(prev => ({
      ...prev,
      previousWeekTasks: [...(prev.previousWeekTasks || []), newTask]
    }));
  };

  const handleRemovePrevTask = (taskId: string) => {
    setReport(prev => ({
      ...prev,
      previousWeekTasks: (prev.previousWeekTasks || []).filter(t => t.id !== taskId)
    }));
  };

  const handlePrevTaskNameChange = (taskId: string, name: string) => {
    setReport(prev => ({
      ...prev,
      previousWeekTasks: (prev.previousWeekTasks || []).map(t => 
        t.id === taskId ? { ...t, name } : t
      )
    }));
  };

  const handlePrevTaskStatusChange = (taskId: string, status: TaskStatus) => {
    setReport(prev => ({
      ...prev,
      previousWeekTasks: (prev.previousWeekTasks || []).map(t => 
        t.id === taskId ? { ...t, status, reasonNotCompleted: status === 'completed' ? undefined : t.reasonNotCompleted } : t
      )
    }));
  };

  const handlePrevTaskScoreChange = (taskId: string, score: number) => {
    setReport(prev => ({
      ...prev,
      previousWeekTasks: (prev.previousWeekTasks || []).map(t => 
        t.id === taskId ? { ...t, evaluationScore: score } : t
      )
    }));
  };

  const handlePrevTaskReasonChange = (taskId: string, reason: string) => {
    setReport(prev => ({
      ...prev,
      previousWeekTasks: (prev.previousWeekTasks || []).map(t => 
        t.id === taskId ? { ...t, reasonNotCompleted: reason } : t
      )
    }));
  };

  // Handlers for Current Week Tasks Planning
  const handleAddCurrentTask = () => {
    const newTask: Task = {
      id: uuidv4(),
      name: '',
      importance: 5,
      status: 'pending',
    };
    setReport(prev => ({
      ...prev,
      currentWeekTasks: [...(prev.currentWeekTasks || []), newTask]
    }));
  };

  const handleRemoveCurrentTask = (taskId: string) => {
    setReport(prev => ({
      ...prev,
      currentWeekTasks: (prev.currentWeekTasks || []).filter(t => t.id !== taskId)
    }));
  };

  const handleCurrentTaskChange = (taskId: string, field: keyof Task, value: any) => {
    setReport(prev => ({
      ...prev,
      currentWeekTasks: (prev.currentWeekTasks || []).map(t => 
        t.id === taskId ? { ...t, [field]: value } : t
      )
    }));
  };

  // Validation
  const validateForm = (): boolean => {
    setError(null);

    // 1. All previous tasks must be evaluated
    const prevTasks = report.previousWeekTasks || [];
    const unEvaluatedPrevTasks = prevTasks.filter(t => 
      t.status === 'pending' || 
      t.evaluationScore === undefined || 
      (t.status === 'not_completed' && (!t.reasonNotCompleted || t.reasonNotCompleted.trim() === ''))
    );

    if (unEvaluatedPrevTasks.length > 0) {
      setError('يرجى تقييم جميع مهام الأسبوع الماضي بشكل كامل (الحالة، التقييم، وسبب عدم الإنجاز إن وجد).');
      return false;
    }

    // 1.5 Unplanned tasks must have names
    const invalidPrevTasks = prevTasks.filter(t => t.isUnplanned && (!t.name || t.name.trim() === ''));
    if (invalidPrevTasks.length > 0) {
      setError('يرجى إدخال اسم لجميع المهام الإضافية المنجزة.');
      return false;
    }

    // 2. Must have at least one current week task
    const currentTasks = report.currentWeekTasks || [];
    if (currentTasks.length === 0) {
      setError('يرجى إضافة مهمة واحدة على الأقل لخطة الأسبوع الحالي.');
      return false;
    }

    // 3. Current tasks must have names
    const invalidCurrentTasks = currentTasks.filter(t => !t.name || t.name.trim() === '');
    if (invalidCurrentTasks.length > 0) {
      setError('يرجى إدخال اسم لجميع مهام الأسبوع الحالي.');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const metrics = calculateMetrics(report.previousWeekTasks);
    
    const finalReport: WeeklyReport = {
      ...report,
      isSubmitted: true,
      submittedAt: new Date().toISOString(),
      metrics,
    };

    saveReport(finalReport);
    navigate('/history');
  };

  const handleSaveDraft = () => {
    saveReport(report);
    navigate('/');
  };

  if (isLoading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">تقرير الأسبوع الحالي</h1>
          <p className="text-slate-500 mt-1">
            {formatDate(start)} - {formatDate(end)}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSaveDraft} className="gap-2">
            <Save className="w-4 h-4" />
            حفظ كمسودة
          </Button>
          <Button onClick={handleSubmit} className="gap-2">
            <CheckCircle className="w-4 h-4" />
            إرسال التقرير
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Section 1: Evaluate Previous Week */}
      <Card className="border-indigo-100 shadow-sm">
        <CardHeader className="bg-indigo-50/50 border-indigo-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">1</div>
              <CardTitle className="text-indigo-900">ما تم إنجازه (تقييم خطة الأسبوع المنصرف)</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={handleAddPrevTask} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 gap-1">
              <Plus className="w-4 h-4" />
              إضافة مهمة إضافية (غير مخططة)
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {(!report.previousWeekTasks || report.previousWeekTasks.length === 0) ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
              <p className="font-medium text-slate-700 mb-2">لا توجد مهام مسجلة من الأسبوع الماضي.</p>
              <p className="text-sm mb-4">هل قمت بإنجاز مهام غير مخططة؟ يمكنك إضافتها الآن.</p>
              <Button size="sm" variant="outline" onClick={handleAddPrevTask} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 gap-1">
                <Plus className="w-4 h-4" />
                إضافة مهمة منجزة
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {report.previousWeekTasks.map((task, index) => (
                <div key={task.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">مهمة {index + 1}</span>
                        {task.isUnplanned && (
                          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">مهمة إضافية</span>
                        )}
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md">أهمية: {task.importance}/10</span>
                        {task.isUnplanned && (
                          <button 
                            onClick={() => handleRemovePrevTask(task.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors mr-auto"
                            title="حذف المهمة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {task.isUnplanned ? (
                        <div className="space-y-3 mt-2">
                          <Input 
                            placeholder="اسم المهمة المنجزة..."
                            value={task.name}
                            onChange={(e) => handlePrevTaskNameChange(task.id, e.target.value)}
                            className="font-bold text-slate-800"
                          />
                          <Input 
                            placeholder="وصف مختصر (اختياري)..."
                            value={task.description || ''}
                            onChange={(e) => {
                              setReport(prev => ({
                                ...prev,
                                previousWeekTasks: prev.previousWeekTasks.map(t => 
                                  t.id === task.id ? { ...t, description: e.target.value } : t
                                )
                              }));
                            }}
                          />
                        </div>
                      ) : (
                        <>
                          <h4 className="font-bold text-slate-800 text-lg">{task.name}</h4>
                          {task.description && <p className="text-sm text-slate-500 mt-1">{task.description}</p>}
                        </>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="grid grid-cols-2 gap-4">
                        <Select 
                          label="حالة التنفيذ" 
                          value={task.status} 
                          onChange={(e) => handlePrevTaskStatusChange(task.id, e.target.value as TaskStatus)}
                          className={task.status === 'completed' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : task.status === 'not_completed' ? 'border-red-300 bg-red-50 text-red-800' : ''}
                        >
                          <option value="pending" disabled>اختر الحالة...</option>
                          <option value="completed">تم التنفيذ</option>
                          <option value="not_completed">لم يتم التنفيذ</option>
                        </Select>
                        
                        <Select 
                          label="درجة التقييم (0-10)" 
                          value={task.evaluationScore ?? ''} 
                          onChange={(e) => handlePrevTaskScoreChange(task.id, Number(e.target.value))}
                        >
                          <option value="" disabled>اختر التقييم...</option>
                          {[...Array(11)].map((_, i) => (
                            <option key={i} value={i}>{i} / 10</option>
                          ))}
                        </Select>
                      </div>
                      
                      {task.status === 'not_completed' && (
                        <Textarea 
                          label="سبب عدم الإنجاز (إلزامي)" 
                          placeholder="يرجى توضيح سبب عدم إنجاز المهمة..."
                          value={task.reasonNotCompleted || ''}
                          onChange={(e) => handlePrevTaskReasonChange(task.id, e.target.value)}
                          className="border-red-200 focus:border-red-500 focus:ring-red-500"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Plan Current Week */}
      <Card className="border-emerald-100 shadow-sm">
        <CardHeader className="bg-emerald-50/50 border-emerald-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">2</div>
              <CardTitle className="text-emerald-900">خطة الأسبوع الحالي</CardTitle>
            </div>
            <Button size="sm" onClick={handleAddCurrentTask} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
              <Plus className="w-4 h-4" />
              إضافة مهمة
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {(!report.currentWeekTasks || report.currentWeekTasks.length === 0) ? (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-emerald-500">
                <Plus className="w-8 h-8" />
              </div>
              <p className="font-medium text-slate-700">لم تقم بإضافة أي مهام بعد</p>
              <p className="text-sm mt-1 mb-4">ابدأ بإضافة مهامك المخططة لهذا الأسبوع</p>
              <Button onClick={handleAddCurrentTask} className="bg-emerald-600 hover:bg-emerald-700">
                إضافة المهمة الأولى
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {report.currentWeekTasks.map((task, index) => (
                <div key={task.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative group">
                  <button 
                    onClick={() => handleRemoveCurrentTask(task.id)}
                    className="absolute top-4 left-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="حذف المهمة"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">مهمة {index + 1}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-8">
                      <Input 
                        label="اسم المهمة" 
                        placeholder="ما الذي تخطط لإنجازه؟"
                        value={task.name}
                        onChange={(e) => handleCurrentTaskChange(task.id, 'name', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-4">
                      <Select 
                        label="درجة الأهمية (1-10)" 
                        value={task.importance}
                        onChange={(e) => handleCurrentTaskChange(task.id, 'importance', Number(e.target.value))}
                      >
                        {[...Array(10)].map((_, i) => (
                          <option key={i+1} value={i+1}>{i+1} - {i+1 === 10 ? 'أهمية قصوى' : i+1 === 1 ? 'أهمية منخفضة' : ''}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="md:col-span-12">
                      <Input 
                        label="وصف مختصر (اختياري)" 
                        placeholder="تفاصيل إضافية حول المهمة..."
                        value={task.description || ''}
                        onChange={(e) => handleCurrentTaskChange(task.id, 'description', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                onClick={handleAddCurrentTask} 
                className="w-full py-6 border-dashed border-2 hover:border-emerald-400 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                إضافة مهمة أخرى
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-end pt-4">
        <Button size="lg" onClick={handleSubmit} className="gap-2 px-8 shadow-lg shadow-indigo-200">
          <CheckCircle className="w-5 h-5" />
          اعتماد وإرسال التقرير
        </Button>
      </div>
    </div>
  );
}
