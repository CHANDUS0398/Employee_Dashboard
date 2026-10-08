import { db } from "hatchable";
export const access="public";
export const methods=["GET"];
const names={Employee:"Kishore S",Manager:"Priya Sharma",Admin:"Priya Sharma"};
const fmt=v=>v?new Date(v).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true}):null;
export default async function(req,res){
 const role=req.query?.role||"Employee",currentUser=names[role]||names.Employee,today="2026-10-08";
 const emps=(await db.query("SELECT * FROM employees ORDER BY id")).rows;
 const projects=(await db.query("SELECT * FROM projects ORDER BY id")).rows;
 const user=emps.find(e=>e.name===currentUser)||emps[0];
 const tasks=(await db.query("SELECT t.*,p.name project,e.name assignee FROM tasks t JOIN projects p ON p.id=t.project_id JOIN employees e ON e.id=t.assignee_id WHERE $1 IN ('Manager','Admin') OR e.id=$2 ORDER BY t.due_date,t.id",[role,user.id])).rows;
 const att=(await db.query("SELECT * FROM attendance WHERE employee_id=$1 AND work_date BETWEEN '2026-10-01' AND '2026-10-31' ORDER BY work_date DESC",[user.id])).rows;
 const teamAtt=(await db.query("SELECT a.*,e.name employee,e.department FROM attendance a JOIN employees e ON e.id=a.employee_id WHERE a.work_date=$1 ORDER BY e.id",[today])).rows;
 const acts=(await db.query("SELECT a.*,p.name project,e.name employee FROM activities a JOIN projects p ON p.id=a.project_id JOIN employees e ON e.id=a.employee_id WHERE a.employee_id=$1 ORDER BY a.activity_date DESC,a.start_time DESC",[user.id])).rows;
 const teamActs=(await db.query("SELECT a.*,p.name project,e.name employee FROM activities a JOIN projects p ON p.id=a.project_id JOIN employees e ON e.id=a.employee_id WHERE a.activity_date BETWEEN '2026-10-01' AND '2026-10-08' ORDER BY a.activity_date DESC,a.start_time,e.id")).rows;
 const work=att.filter(a=>a.status!=="WEEKEND"),present=work.filter(a=>["PRESENT","LATE"].includes(a.status)).length,late=work.filter(a=>a.status==="LATE").length,absent=work.filter(a=>a.status==="ABSENT").length;
 const ta=att.find(a=>String(a.work_date).slice(0,10)===today),actsToday=acts.filter(a=>String(a.activity_date).slice(0,10)===today);
 const hoursToday=actsToday.reduce((s,a)=>s+a.duration_minutes,0),hoursWeek=acts.reduce((s,a)=>s+a.duration_minutes,0);
 const totalTasks=tasks.length,pending=tasks.filter(t=>t.status==="TODO").length,inProgress=tasks.filter(t=>t.status==="IN_PROGRESS").length,overdue=tasks.filter(t=>t.status!=="COMPLETED"&&String(t.due_date).slice(0,10)<today).length;
 const weekly=[["Mon","2026-10-05"],["Tue","2026-10-06"],["Wed","2026-10-07"],["Thu","2026-10-08"],["Fri","2026-10-09"],["Sat","2026-10-10"]].map(x=>({day:x[0],hours:Math.round(acts.filter(a=>String(a.activity_date).slice(0,10)===x[1]).reduce((s,a)=>s+a.duration_minutes,0)/60*10)/10}));
 const team=emps.map(e=>{const a=teamAtt.find(x=>x.employee===e.name),ts=tasks.filter(t=>t.assignee===e.name);return{name:e.name,role:e.role,department:e.department,activeTasks:ts.filter(t=>t.status!=="COMPLETED").length,completedTasks:ts.filter(t=>t.status==="COMPLETED").length,attStatus:a?.status||"ABSENT",checkIn:fmt(a?.check_in),checkOut:fmt(a?.check_out),hours:a?.hours_minutes?(Math.floor(a.hours_minutes/60)+"h "+(a.hours_minutes%60)+"m"):"0h"}});
 const alerts=[];
 tasks.filter(t=>t.status!=="COMPLETED"&&String(t.due_date).slice(0,10)<today).forEach(t=>alerts.push({title:"Overdue task",detail:t.title+" · "+String(t.due_date).slice(0,10)}));
 if(ta?.check_in&&!ta?.check_out)alerts.push({title:"Missing checkout",detail:"Today’s attendance is still open."});
 tasks.filter(t=>String(t.due_date).slice(0,10)===today&&t.status!=="COMPLETED").forEach(t=>alerts.push({title:"Task due today",detail:t.title}));
 const duration=m=>(Math.floor(m/60)?Math.floor(m/60)+"h ":"")+(m%60?m%60+"m":"");
 res.json({currentUser,tasks:tasks.map(t=>({dbId:t.id,id:"PF-"+String(t.id).padStart(4,"0"),title:t.title,project:t.project,assignee:t.assignee,priority:t.priority,status:t.status,dueDate:String(t.due_date).slice(0,10),startDate:String(t.start_date).slice(0,10),overdue:t.status!=="COMPLETED"&&String(t.due_date).slice(0,10)<today})),
 projects:projects.map(p=>({id:p.id,name:p.name,code:p.code,status:p.status,startDate:String(p.start_date).slice(0,10),targetDate:String(p.target_date).slice(0,10),manager:p.manager,percent:p.status==="COMPLETED"?100:p.status==="IN_PROGRESS"?54:12})),team,
 activitiesToday:actsToday.map(a=>({id:a.id,title:a.title,description:a.description,project:a.project,startTime:fmt("1970-01-01T"+a.start_time),duration:duration(a.duration_minutes),type:a.activity_type})),
 teamActivities:teamActs.map(a=>({id:a.id,title:a.title,description:a.description,project:a.project,employee:a.employee,startTime:fmt("1970-01-01T"+a.start_time),duration:duration(a.duration_minutes),type:a.activity_type})),
 attendance:{todayStatus:ta?.check_out?"CHECKED OUT":ta?.check_in?"CHECKED IN":"NOT CHECKED IN",todayIn:fmt(ta?.check_in),todayOut:fmt(ta?.check_out),todayHours:ta?.hours_minutes?duration(ta.hours_minutes):null,workingDays:work.length,present,absent,late,percent:work.length?Math.round(present/work.length*100):0,records:att.map(a=>({date:String(a.work_date).slice(8,10)+" Oct",status:a.status,checkIn:fmt(a.check_in),checkOut:fmt(a.check_out),hours:a.hours_minutes?duration(a.hours_minutes):null}))},
 stats:{totalTasks,pending,inProgress,overdue,teamMembers:emps.length,activeTasks:tasks.filter(t=>t.status!=="COMPLETED").length,activitiesToday:actsToday.length,hoursToday:(hoursToday/60).toFixed(1),hoursWeek:(hoursWeek/60).toFixed(1),activitiesWeek:acts.length,teamHours:(teamActs.reduce((s,a)=>s+a.duration_minutes,0)/60).toFixed(1)},weekly,alerts});
}
