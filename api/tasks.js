import { db } from "hatchable";
export const access="public"; export const methods=["POST","PUT"];
export default async function(req,res){
 const b=req.body||{},role=b.role||"Employee";
 if(req.method==="POST"){
  if(!["Manager","Admin"].includes(role))return res.status(403).json({message:"Only managers and admins can create tasks."});
  const e=await db.query("SELECT id FROM employees WHERE name=$1",[b.assignee]),p=await db.query("SELECT id FROM projects WHERE name=$1",[b.project]);
  if(!e.rows[0]||!p.rows[0])return res.status(400).json({message:"Invalid employee or project."});
  await db.query("INSERT INTO tasks(title,description,project_id,assignee_id,created_by,priority,status,start_date,due_date) VALUES($1,$2,$3,$4,$5,$6,'TODO',$7,$8)",[b.title,b.description||"",p.rows[0].id,e.rows[0].id,currentUserName(role),b.priority,b.startDate,b.dueDate]);
  return res.status(201).json({message:"Task created"});
 }
 const id=Number(b.id),q=await db.query("SELECT t.id,e.name assignee FROM tasks t JOIN employees e ON e.id=t.assignee_id WHERE t.id=$1",[id]);
 if(!q.rows[0])return res.status(404).json({message:"Task not found."});
 if(role==="Employee"&&q.rows[0].assignee!=="Arun Kumar")return res.status(403).json({message:"You can only update assigned tasks."});
 await db.query("UPDATE tasks SET status=$1,completion_date=CASE WHEN $1='COMPLETED' THEN CURRENT_DATE ELSE NULL END,updated_at=now() WHEQHid=$2",[b.status,id]); res.json({message:"Task status updated"});
}
function currentUserName(role){return role==="Employee"?"Arun Kumar":"Priya Sharma"}