# คู่มือผู้ดูแลระบบ AXON Admin ภาษาไทย

เอกสารนี้สรุปการใช้งานสำหรับผู้ดูแลระบบที่ต้องดูแลหน้าจอบริหารหลักของ AXON Admin เช่น ผู้ใช้, สิทธิ์, plugin, tools, settings, notifications, token และ logs

เอกสารอ้างอิงที่เกี่ยวข้อง:

- คู่มือรวม: [docs/USER_MANUAL_AXON_ADMIN_TH.md](/u01/axon-admin/docs/USER_MANUAL_AXON_ADMIN_TH.md)
- คู่มือ MCP Inspector: [docs/USER_MANUAL_MCP_AGENTS_TESTING_TH.md](/u01/axon-admin/docs/USER_MANUAL_MCP_AGENTS_TESTING_TH.md)

## 1. กลุ่มหน้าจอที่เหมาะกับผู้ดูแลระบบ

ผู้ดูแลระบบจะใช้งานหน้าจอหลักต่อไปนี้บ่อยที่สุด:

1. Login และ Register
2. Dashboard
3. Plugins และ Plugin Detail
4. Tools และ Tool Detail
5. Tokens
6. Users, User Detail, My Profile, Roles
7. Settings และ Environments
8. Notification Channels และ Notification Rules
9. Logs

## 2. Authentication และการเข้าใช้งาน

### Login

Route:

- `/login`

ฟิลด์สำคัญ:

- `Email`
- `Password`
- ปุ่มแสดง/ซ่อนรหัสผ่าน

การใช้งาน:

1. กรอก email ที่ถูกต้อง
2. กรอก password อย่างน้อย 8 ตัวอักษร
3. กด `Sign In`
4. หากสำเร็จระบบจะพาไป `/dashboard`

### Register

Route:

- `/register`

ฟิลด์สำคัญ:

- `Full name`
- `Email`
- `Password`
- `Confirm Password`

จุดทดสอบสำคัญ:

- Password strength ต้องเปลี่ยนตามความแข็งแรง
- Confirm Password ต้องตรงกับ Password

### Forgot Password

Route:

- `/forgot-password`

ฟิลด์สำคัญ:

- `Email`

ผลลัพธ์ที่คาดหวัง:

- เมื่อส่งคำขอสำเร็จ ระบบจะแสดงหน้าสถานะ success ให้เช็กอีเมล

## 3. Dashboard

Route:

- `/dashboard`

หน้าจอนี้ใช้ติดตามภาพรวมระบบแบบเร็วที่สุด

องค์ประกอบสำคัญ:

- `Active Plugins`
- `Total Tools`
- `Total Requests`
- `Error Rate`
- `Active Users`
- กราฟ Daily Request Volume
- กราฟ Requests vs Errors

สิ่งที่ผู้ดูแลควรตรวจทุกครั้ง:

1. Error Rate สูงผิดปกติหรือไม่
2. จำนวน Active Plugins ลดลงหรือไม่
3. กราฟ errors มีแนวโน้มสูงขึ้นหรือไม่

## 4. Plugin Management

### Plugins List

Route:

- `/plugins`

ฟิลด์และการกรอง:

- `Search plugins...`
- `All Status / Active / Inactive / Error`

ปุ่มที่ใช้บ่อย:

- `Health`
- `Delete`

แนวทางใช้งาน:

1. ใช้ search เพื่อหา plugin ตามชื่อ
2. ใช้ status filter เพื่อตรวจเฉพาะ plugin ที่มีปัญหา
3. กด `Health` เพื่อตรวจ endpoint
4. ใช้ `Delete` เฉพาะเมื่อแน่ใจว่าต้องถอดออกจากระบบ

### Plugin Detail

Route:

- `/plugins/[id]`

ฟิลด์สำคัญ:

- `Name`
- `Endpoint`
- `Auth Method`
- `Headers JSON`
- `Timeout`
- `Environment Variables`

ปุ่มสำคัญ:

- `Edit`
- `Save`
- `Health Check`
- `Enable/Disable`
- `Restart`
- `Export config`
- `Delete`

แนวทางใช้งาน:

1. กด `Edit` ก่อนแก้ค่า
2. ตรวจ JSON ใน `Headers JSON` ให้ถูกต้องก่อนบันทึก
3. หลังแก้ endpoint หรือ auth ให้กด `Health Check`
4. ถ้าต้องส่ง config ให้ทีมอื่น ใช้ `Export config`

## 5. Tools Management

### Tools List

Route:

- `/tools`

ใช้สำหรับดูรายการ tools ทั้งหมดและค้นหาตามชื่อ

องค์ประกอบ:

- Search input
- ตาราง tools
- ปุ่ม `Delete`

### Tool Detail

Route:

- `/tools/[id]`

ฟิลด์สำคัญ:

- `Name`
- `Method`
- `Endpoint`
- `Input Schema`
- `Output Schema`
- `Test Input`

ปุ่มสำคัญ:

- `Edit`
- `Save`
- `Format JSON`
- `Play / Run Test`

แนวทางใช้งาน:

1. ตรวจ schema ทุกครั้งก่อน save
2. ใช้ `Format JSON` เพื่อจัดรูปแบบก่อน review
3. ใช้ `Run Test` ทดสอบ input จริงและตรวจ output ว่าตรง schema หรือไม่

## 6. Token Management

### API Tokens

Route:

- `/tokens`

ฟิลด์สำคัญ:

- `Token name`

ปุ่มสำคัญ:

- `Create Token`
- `Copy`
- `Revoke`

ข้อควรระวัง:

- token value จะแสดงเพียงครั้งเดียวหลังสร้าง
- ต้อง copy ทันที
- ถ้าต้องยกเลิกการใช้งานให้ใช้ `Revoke`

## 7. Users & Roles

### Users List

Route:

- `/users`

องค์ประกอบ:

- Search input
- ตารางผู้ใช้
- ปุ่ม `Activate` หรือ `Deactivate`

ใช้สำหรับ:

- เปิด/ปิดสถานะผู้ใช้
- ตรวจ role และ MFA status

### User Detail

Route:

- `/users/[id]`

ฟิลด์สำคัญ:

- `Full name`
- `Email`
- `Status`
- `Role input`

ปุ่มสำคัญ:

- `Edit`
- `Save`
- `Cancel`
- `Add Role`
- `Remove role`
- `Revoke session`
- `Delete user`

แนวทางใช้งาน:

1. ใช้ `Edit` และ `Save` เมื่อเปลี่ยนข้อมูลผู้ใช้
2. ใช้ `Add Role` เพื่อเพิ่มสิทธิ์
3. ใช้ `Revoke session` ถ้าต้องตัดการใช้งานจากอุปกรณ์เดิม
4. ใช้ `Delete user` เฉพาะกรณีต้องลบจริง

### My Profile

Route:

- `/users/profile`

ฟิลด์สำคัญ:

- `Full name`
- `Current password`
- `New password`
- `Confirm new password`

ปุ่มสำคัญ:

- `Save profile`
- `Change password`
- `Revoke`

### Roles & Permissions

Route:

- `/users/roles`

ใช้สำหรับ:

- สร้าง role ใหม่
- ดู permissions reference
- ลบ role ที่ไม่ต้องใช้

ฟิลด์ใน modal:

- `Name`
- `Description`

ปุ่มสำคัญ:

- `New Role`
- `Delete role`

## 8. Settings และ Environment Management

### Settings

Route:

- `/settings`

tabs หลัก:

- `General`
- `Security`
- `API Gateway`
- `MCP`
- `Notifications`
- `Branding`
- `Feature Flags`

หลักการใช้งาน:

1. เลือก tab ที่ต้องการแก้
2. ปรับค่าที่ต้องการ
3. กด `Save Changes`
4. refresh หรือกลับเข้ามาใหม่เพื่อตรวจว่าค่าคงอยู่

### Environments List

Route:

- `/settings/environments`

ฟิลด์ใน modal:

- `Name`
- `Slug`

ปุ่มสำคัญ:

- `New Environment`

### Environment Detail

Route:

- `/settings/environments/[id]`

องค์ประกอบหลัก:

- ตาราง variables
- ปุ่มรูปตาสำหรับ field แบบ secret

หมายเหตุ:

- ถ้าเป็น secret ระบบจะไม่แสดงค่า plaintext จริง

## 9. Notification Administration

### Notification Channels

Route:

- `/notifications/channels`

tabs หลัก:

- `Email (SMTP)`
- `Slack`
- `Discord`
- `Telegram`

ฟิลด์สำคัญ:

#### SMTP

- `SMTP Host`
- `Port`
- `Username`
- `Password`
- `From Address`

#### Slack / Discord

- `Webhook URL`

#### Telegram

- `Bot Token`
- `Chat ID`

ปุ่มสำคัญ:

- `Save SMTP`
- `Save Slack`
- `Save Discord`
- `Save Telegram`

### Notification Rules

Route:

- `/notifications/rules`

ฟิลด์สำคัญใน modal:

- `Event Type`
- `Threshold`
- `Channels`

ปุ่มสำคัญ:

- `Add Rule`
- `Save`
- `Toggle`
- `Edit`
- `Delete`

แนวทางใช้งาน:

1. เลือก event type ให้ตรงเหตุการณ์ที่ต้องแจ้งเตือน
2. เลือก channels อย่างน้อย 1 ค่า
3. ถ้าต้องมีเกณฑ์ เช่น latency ให้ใส่ threshold
4. เปิด/ปิด rule ด้วย toggle ตามต้องการ

## 10. Logs & Monitoring

### Logs

Route:

- `/logs`

tabs หลัก:

- `Audit`
- `System`
- `Execution`

ฟิลด์และ filter:

- Search input
- Level filter ใน System tab

ใช้สำหรับ:

- ตรวจสอบกิจกรรมของผู้ใช้
- ตรวจสอบ error และ warning ของระบบ
- ดู execution history

## 11. เช็กลิสต์สำหรับผู้ดูแลระบบ

สิ่งที่ควรตรวจประจำ:

1. Dashboard ไม่มี error rate ผิดปกติ
2. Plugin ที่สำคัญยัง `healthy`
3. ไม่มี token ที่ไม่ควร active ค้างอยู่
4. Notification channels ยังเก็บ config ครบ
5. Notification rules สำคัญยัง active
6. System logs ไม่มี error ร้ายแรงใหม่
7. Users ที่ไม่ควรเข้าใช้งานถูก deactivate แล้ว
