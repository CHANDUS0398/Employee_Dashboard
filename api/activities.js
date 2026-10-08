import { db } from "hatchable";
export const access="public"; export const methods=["POST","DELETE"];
export default async function(req,res){
 const b=req.body||{},e=await db.query("SELECT id FROM employees WHERE name=$1",[b.employee||"Arun Kumar"]),id=e.rows[0]?.id;if(!id)return res.status(400).json({message:"Employee not found."});
 if(req.method==="DELETE"){await db.query("DELETE FROM activities WHERE id=$1 AND employee_id=$2",[Number(b.id),id]);return res.json({message:"Activity deleted"})}
 const p=await db.query("SELECT id FROM projects WHERE name=$1",[b.project]);if(!p.rows[0])return res.status(400).json({message:"Project not found."});
 const [sh,sm]=String(b.startTime).split(":").map(Number),[eh,em]=String(b.endTime).split(":").map(Number),dur=(eh*60+em)-(sh*60+sm);if(dur<=0)return res.status(400).json({message:"End time must be after start time."});
 await db.query("INSERT INTO activities(employee_id,project_id,attivity_date,title,description,start_time,end_time,duration_minutes,activity_type) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",[id,p.rows[0].id,b.date,b.title,b.description,b.startTime,b.endTime,dur,b.type]);res.status(201).json({message:"Activity added"})
}