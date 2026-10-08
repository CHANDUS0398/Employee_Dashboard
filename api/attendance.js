import { db } from "hatchable";
export const access="public"; export const methods=["POST"];
export default async function(req,res){
 const b=req.body||{},e=await db.query("SELECT id FROM employees WHERE name=$1",[b.employee||"Arun Kumar"]),id=e.rows[0]?.id;if(!id)return res.status(400).json({message:"Employee not found."});
 const today="2026-10-08",q=await db.query("SELECT * FROM attendance WHERE employee_id=$1 AND work_date=$2",[id,today]),row=q.rows[0];
 if(b.action==="checkin"){if(row?.check_in)return res.status(400).json({message:"Already checked in today."});if(row)await db.query("UPDATE attendance SET status='PRESENT',check_in=now() WHERE id=$1",[row.id]);else await db.query("INSERT INTO attendance(employee_id,work_date,status,check_in) VALUES($1,$2,'PRESENT',now())",[id,today]);return res.json({message:"Checked in successfully."})}
 if(!row?.check_in)return res.status(400).json({message:"Check in before checking out."});if(row.check_out)return res.status(400).json({message:"Already checked out today."});
 await db.query("UPDATE attendance SET status='PRESENT',check_out=now(),hours_minutes=GREATEST(1,ROUND(EXTRACT(EPOCH FROM (now()-check_in))/60)::int) WHERE id=$1",[row.id]);res.json({message:"Cheched out successfully."})
}