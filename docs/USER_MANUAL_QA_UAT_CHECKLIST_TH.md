# คู่มือ QA / UAT Checklist ภาษาไทย สำหรับ AXON Admin

เอกสารนี้ออกแบบสำหรับทีม QA, UAT และผู้ทดสอบระบบ โดยสรุปเป็น checklist ตามหน้าจอ เพื่อใช้ตรวจรับระบบอย่างเป็นขั้นตอน

เอกสารอ้างอิง:

- คู่มือรวม: [docs/USER_MANUAL_AXON_ADMIN_TH.md](/u01/axon-admin/docs/USER_MANUAL_AXON_ADMIN_TH.md)
- คู่มือ MCP Agents Testing: [docs/USER_MANUAL_MCP_AGENTS_TESTING_TH.md](/u01/axon-admin/docs/USER_MANUAL_MCP_AGENTS_TESTING_TH.md)

## 1. วิธีใช้เอกสารนี้

สำหรับแต่ละหน้าจอ ให้ตรวจอย่างน้อย 4 มิติ:

1. เปิดหน้าได้
2. โหลดข้อมูลได้
3. ปุ่มและฟิลด์ทำงานถูกต้อง
4. มีผลลัพธ์ตรงตามที่คาดหวัง

## 2. Authentication Checklist

### Login

- เปิด `/login` ได้
- กรอก email ไม่ถูก format แล้วมี validation error
- กรอกรหัสผ่านต่ำกว่า 8 ตัวอักษรแล้วมี validation error
- กดแสดง/ซ่อนรหัสผ่านได้
- login ด้วยข้อมูลถูกต้องแล้ว redirect ไป `/dashboard`

### Register

- เปิด `/register` ได้
- Full name ต่ำกว่า 2 ตัวอักษรแล้วมี validation
- Password strength bar เปลี่ยนตาม input
- Confirm Password ไม่ตรงแล้วมี error
- สมัครสำเร็จแล้ว redirect ไป `/login`

### Forgot Password

- เปิด `/forgot-password` ได้
- กรอก email ถูกต้องแล้ว submit ได้
- แสดงสถานะ success หลังส่งคำขอ

## 3. Dashboard Checklist

- เปิด `/dashboard` ได้
- ระหว่างโหลดมี skeleton cards
- KPI cards แสดงข้อมูลครบ
- Daily Request Volume chart แสดงข้อมูล
- Requests vs Errors chart แสดงข้อมูล
- Error Rate มากกว่า 10% แสดงสีเตือนถูกต้อง

## 4. Plugins Checklist

### Plugins List

- เปิด `/plugins` ได้
- Search กรองผลลัพธ์ได้
- Status filter กรองผลลัพธ์ได้
- ปุ่ม `Health` ทำงานและมี toast
- ปุ่ม `Delete` มี confirm ก่อนลบ
- Pagination ทำงานถูกต้อง

### Plugin Detail

- เปิด `/plugins/[id]` ได้
- กด `Edit` แล้ว field เปลี่ยนเป็นแก้ไขได้
- กด `Save` แล้วข้อมูลอัปเดต
- `Headers JSON` รับเฉพาะ JSON ที่ถูกต้อง
- `Health Check` ทำงานได้
- `Export config` ดาวน์โหลดไฟล์ได้

## 5. Tools Checklist

### Tools List

- เปิด `/tools` ได้
- Search ทำงานถูกต้อง
- Delete ทำงานพร้อม confirm

### Tool Detail

- เปิด `/tools/[id]` ได้
- กด `Edit` ได้
- `Format JSON` ทำงานได้
- `Run Test` แสดงผลลัพธ์ได้
- JSON ผิด format แล้วเกิด error ตามคาด

## 6. Tokens Checklist

- เปิด `/tokens` ได้
- Create button ถูก disable เมื่อชื่อ token ว่าง
- สร้าง token แล้วแสดงค่า one-time
- ปุ่ม `Copy` ทำงานได้
- ปุ่ม `Revoke` เปลี่ยนสถานะ token ได้

## 7. Users & Roles Checklist

### Users List

- เปิด `/users` ได้
- Search ทำงานได้
- Activate/Deactivate เปลี่ยนสถานะได้
- MFA badge แสดงถูกต้อง

### User Detail

- เปิด `/users/[id]` ได้
- Edit/Save ทำงานได้
- Add Role ทำงานได้
- Remove role ทำงานได้
- Revoke session ทำงานได้
- Delete user ทำงานได้และ redirect กลับ list

### My Profile

- เปิด `/users/profile` ได้
- Save profile ทำงานได้
- Change password ทำงานได้เมื่อข้อมูลถูกต้อง
- Confirm password ไม่ตรงแล้วมี validation
- Revoke session ทำงานได้

### Roles & Permissions

- เปิด `/users/roles` ได้
- เปิด modal สร้าง role ได้
- สร้าง role ใหม่ได้
- ลบ role ได้

## 8. Settings & Environment Checklist

### Settings

- เปิด `/settings` ได้
- สลับ tab ได้ครบทุกแท็บ
- เปลี่ยนค่าหนึ่ง field แล้วปุ่ม `Save Changes` ถูก enable
- Save แล้วค่าอยู่หลัง refresh

### Environments List

- เปิด `/settings/environments` ได้
- เปิด modal สร้าง environment ได้
- Name สร้าง slug อัตโนมัติได้
- สร้าง environment ใหม่แล้ว card ปรากฏ

### Environment Detail

- เปิด `/settings/environments/[id]` ได้
- แสดง table ของ variables ได้
- secret fields แสดงแบบซ่อนค่า
- ปุ่มรูปตาทำงานได้

## 9. Notifications Checklist

### Notifications Inbox

- เปิด `/notifications` ได้
- unread count แสดงถูกต้อง
- คลิกรายการ unread แล้ว mark as read ได้
- `Mark all read` ทำงานได้

### Notification Channels

- เปิด `/notifications/channels` ได้
- สลับ tab SMTP/Slack/Discord/Telegram ได้
- Save SMTP ทำงานได้
- Save Slack ทำงานได้
- Save Discord ทำงานได้
- Save Telegram ทำงานได้

### Notification Rules

- เปิด `/notifications/rules` ได้
- Add Rule เปิด modal ได้
- ต้องเลือก channels อย่างน้อย 1 ค่า
- Save rule ใหม่ได้
- Toggle เปิด/ปิด rule ได้
- Edit rule ได้
- Delete rule ได้

## 10. Logs Checklist

- เปิด `/logs` ได้
- สลับ tab Audit/System/Execution ได้
- Search ทำงานได้
- Level filter ใน System tab ทำงานได้
- Pagination ทำงานได้

## 11. AXON System Checklist

### AXON Overview

- เปิด `/axon` ได้
- KPI cards แสดงข้อมูล
- สลับ tab orchestrator/AI agent ได้
- คลิก orchestrator run แล้วเปิดหน้า detail ได้

### Orchestrator Detail

- เปิด `/axon/orchestrator?id=...` ได้
- แสดง metadata cards ได้
- เปิด output JSON ในแต่ละ stage ได้
- ถ้า run ยัง running มี auto-refresh

### HITL Queue

- เปิด `/axon/hitl` ได้
- สลับ tab Pending/Approved/Rejected ได้
- เปิด note textarea ได้
- Approve ทำงานได้
- Reject ทำงานได้

### Experience Ledger

- เปิด `/axon/experience` ได้
- Search ทำงานได้
- Expand card เพื่อดูรายละเอียดได้
- Pagination ทำงานได้

### Supply Chain

- เปิด `/axon/supply-chain` ได้
- สลับ tab Demand/Supply/Allocation ได้
- ทุก table เป็น read-only

## 12. Testing Checklist

### Testing Console

- เปิด `/testing` ได้
- Search ทำงานได้
- Run request แล้วมี Last Execution Result
- Delete request ทำงานได้
- ปุ่ม `Open MCP Agents Testing` เปิด route ถูกต้อง

### Orchestrator Testing

- เปิด `/testing/orchestrator` ได้
- กรอก prompt และเลือก model ได้
- Run test ได้
- Stage visualization อัปเดตสถานะได้
- JSON viewer เปิด/ปิดได้

### Pydantic AI Testing

- เปิด `/testing/pydantic-ai` ได้
- เลือก agent ได้
- กรอก prompt และ run ได้
- Message cards แสดงลำดับถูกต้อง
- Token count แสดงได้

### MCP Agents Testing

- เปิด `/testing/mcp-agents` ได้
- ใช้งานตาม checklist ในคู่มือเฉพาะ

## 13. UAT Sign-off Checklist

ก่อน sign-off ระบบ ควรยืนยันว่า:

1. ผู้ใช้ login/logout ได้
2. Dashboard แสดงข้อมูลจริง
3. หน้าบริหารหลักเปิดได้ครบทุกหน้า
4. Actions สำคัญทำงานได้ เช่น save, delete, revoke, toggle
5. Notifications และ settings บันทึกได้
6. AXON monitoring pages ใช้งานได้
7. Testing pages ใช้งานได้ครบ
8. ไม่มี blocking issue ใน flow หลักของระบบ
