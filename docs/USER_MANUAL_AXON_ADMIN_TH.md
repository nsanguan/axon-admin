# คู่มือผู้ใช้งาน AXON Admin ภาษาไทย

เอกสารนี้เป็นคู่มือการใช้งานหน้าจอทั้งหมดใน AXON Admin สำหรับผู้ใช้งาน, QA, UAT และทีมปฏิบัติการ โดยเน้น 2 เรื่องหลัก:

- วิธีใช้งานและวิธีทดสอบแต่ละหน้าจอ
- รายละเอียด field, button, tab, table และพฤติกรรมที่เห็นบนหน้าจอ

เอกสารนี้ครอบคลุมหน้าจอทั้งหมดในระบบ ยกเว้นหน้าจอ `MCP Agents Testing` ซึ่งมีคู่มือแยกแล้วที่:

- [docs/USER_MANUAL_MCP_AGENTS_TESTING_TH.md](/u01/axon-admin/docs/USER_MANUAL_MCP_AGENTS_TESTING_TH.md)

## 1. โครงสร้างเมนูหลักของระบบ

หน้าจอหลักใน AXON Admin แบ่งเป็นหมวดดังนี้:

1. Authentication
2. Dashboard
3. Plugin Management
4. Tools Management
5. Testing Console
6. Tokens & Security
7. Logs & Monitoring
8. Notifications
9. AXON System
10. Users & Roles
11. Settings และ Environments

## 2. แนวทางการทดสอบมาตรฐานที่ใช้ได้กับทุกหน้า

ทุกหน้าจอควรทดสอบอย่างน้อยตามรายการนี้:

1. เปิดหน้าได้สำเร็จโดยไม่ error
2. ข้อมูล loading state แสดงผลถูกต้อง
3. ถ้ามี table ต้องตรวจสอบกรณีมีข้อมูลและไม่มีข้อมูล
4. ถ้ามี form ต้องตรวจสอบ validation และข้อความแจ้งเตือน
5. ถ้ามี action button ต้องตรวจสอบผลลัพธ์หลัง submit
6. ถ้ามี search/filter ต้องตรวจสอบการ reset page และผลการกรอง
7. ถ้ามี pagination ต้องตรวจสอบปุ่ม `Prev` และ `Next`
8. ถ้ามี mutation ต้องตรวจสอบ toast success/error

## 3. Authentication

### 3.1 หน้า Login

เส้นทาง:

- `/login`

วัตถุประสงค์:

- ใช้สำหรับเข้าสู่ระบบ AXON Admin

องค์ประกอบบนหน้าจอ:

- ช่อง `Email`
- ช่อง `Password`
- ปุ่มแสดง/ซ่อนรหัสผ่าน
- ปุ่ม `Sign In`

รายละเอียดแต่ละ field:

#### Email (Login)

- ประเภทข้อมูล: อีเมล
- ต้องกรอก
- ต้องอยู่ในรูปแบบ email ที่ถูกต้อง
- ตัวอย่าง: `admin@axon.local`

#### Password (Login)

- ประเภทข้อมูล: ข้อความ
- ต้องกรอก
- ขั้นต่ำ 8 ตัวอักษร

ปุ่มและการทำงาน:

#### ปุ่มแสดง/ซ่อนรหัสผ่าน

- ใช้สลับระหว่างการแสดงรหัสผ่านเป็นตัวอักษรและซ่อนเป็นจุด

#### ปุ่ม Sign In

- เมื่อกดแล้วระบบจะเรียก API login
- ถ้าสำเร็จจะเก็บ access token และ refresh token แล้วพาไปหน้า `/dashboard`

วิธีทดสอบ:

1. กรอก email ถูกต้องและ password ถูกต้อง
2. กด `Sign In`
3. ตรวจสอบว่าระบบพาไปหน้า Dashboard
4. ทดสอบกรอก email ไม่ถูก format
5. ตรวจสอบว่ามี validation error
6. ทดสอบกรอกรหัสผ่านสั้นกว่า 8 ตัว
7. ตรวจสอบว่าปุ่ม submit ไม่ส่งค่าที่ผิดเงื่อนไข

### 3.2 หน้า Register

เส้นทาง:

- `/register`

วัตถุประสงค์:

- ใช้สำหรับสร้างบัญชีผู้ใช้ใหม่

องค์ประกอบบนหน้าจอ:

- ช่อง `Full name`
- ช่อง `Email`
- ช่อง `Password`
- ช่อง `Confirm Password`
- ตัวชี้วัดความแข็งแรงของรหัสผ่าน
- ปุ่ม `Create Account`
- ลิงก์กลับไปหน้า Sign In

รายละเอียด field:

#### Full name (Register)

- ขั้นต่ำ 2 ตัวอักษร

#### Email (Register)

- ต้องเป็นรูปแบบ email

#### Password (Register)

- ขั้นต่ำ 8 ตัวอักษร
- มีการประเมินความแข็งแรง เช่น Weak, Fair, Good, Strong

#### Confirm Password

- ต้องตรงกับ Password

วิธีทดสอบ:

1. กรอกข้อมูลครบทุกช่องด้วยค่าที่ถูกต้อง
2. ตรวจสอบว่าค่าความแข็งแรงของรหัสผ่านเปลี่ยนตาม input
3. กด `Create Account`
4. ตรวจสอบว่าระบบพาไปหน้า `/login`
5. ทดสอบกรอก password และ confirm password ไม่ตรงกัน
6. ตรวจสอบข้อความ error

### 3.3 หน้า Forgot Password

เส้นทาง:

- `/forgot-password`

วัตถุประสงค์:

- ใช้สำหรับส่งคำขอ reset password

องค์ประกอบบนหน้าจอ:

- ช่อง `Email`
- ปุ่ม `Send reset link`
- ลิงก์ `Back to sign in`

รายละเอียด field:

#### Email (Forgot Password)

- ต้องกรอกและต้องเป็น email ที่ถูกต้อง

วิธีทดสอบ:

1. กรอก email ที่ถูกต้อง
2. กด `Send reset link`
3. ตรวจสอบว่าหน้าจอแสดงสถานะ success
4. ตรวจสอบว่ามีข้อความให้เช็ก inbox และ spam folder

## 4. Dashboard

### 4.1 หน้า Dashboard

เส้นทาง:

- `/dashboard`

วัตถุประสงค์:

- แสดงภาพรวมของระบบ AXON แบบ real-time

องค์ประกอบบนหน้าจอ:

- KPI Cards
- กราฟ Daily Request Volume
- กราฟ Requests vs Errors

รายละเอียดการ์ดบนหน้าจอ:

#### Active Plugins

- จำนวน plugin ที่ active อยู่

#### Total Tools

- จำนวน tools ทั้งหมดในระบบ

#### Total Requests

- จำนวน requests สะสมหรือช่วงเวลาที่ backend ส่งมาให้

#### Error Rate

- เปอร์เซ็นต์ error
- ถ้าสูงกว่า 10% การ์ดจะแสดงเป็นสีแดง

#### Active Users

- จำนวนผู้ใช้ที่ active

วิธีทดสอบ:

1. เปิดหน้า Dashboard
2. ตรวจสอบว่ามี skeleton loader ตอนโหลดข้อมูล
3. รอให้ KPI cards แสดงผล
4. ตรวจสอบว่ากราฟแสดงข้อมูลเมื่อ backend ส่ง dailyUsage มา
5. ถ้าจำลองค่า errorRate มากกว่า 10 ให้ตรวจสอบว่าสี card เปลี่ยนเป็นแดง

## 5. Plugin Management

### 5.1 หน้า Plugins List

เส้นทาง:

- `/plugins`

วัตถุประสงค์:

- ใช้ค้นหา ดูสถานะ และจัดการรายการ MCP Plugins

องค์ประกอบบนหน้าจอ:

- ช่อง `Search plugins...`
- dropdown `All Status`
- ตาราง plugins
- ปุ่ม `Health`
- ปุ่ม `Delete`
- pagination

รายละเอียด field:

#### Search plugins

- ใช้ค้นหาชื่อ plugin
- เมื่อพิมพ์จะ reset page กลับไปหน้า 1

#### Status Filter

- ตัวเลือก: `All Status`, `Active`, `Inactive`, `Error`

รายละเอียดตาราง:

- Name
- Endpoint
- Status
- Health
- Group
- Actions

ปุ่มในแต่ละแถว:

#### Health

- ใช้ตรวจสอบ health ของ plugin นั้น

#### Delete

- ใช้ลบ plugin
- มี confirm ก่อนลบ

วิธีทดสอบ:

1. เปิดหน้า Plugins
2. กรอกคำค้นหาใน Search
3. ตรวจสอบว่าตารางถูกกรองตามคำค้น
4. เลือก status filter แล้วตรวจสอบผลลัพธ์
5. กด `Health` ที่แถวใดแถวหนึ่ง
6. ตรวจสอบ toast ที่แสดงผลลัพธ์ health
7. กด `Delete` และกดยืนยัน
8. ตรวจสอบว่าแถวนั้นหายไปจากตาราง

### 5.2 หน้า Plugin Detail

เส้นทาง:

- `/plugins/[id]`

วัตถุประสงค์:

- ใช้ดูและแก้ไขรายละเอียด plugin

องค์ประกอบบนหน้าจอ:

- ปุ่มย้อนกลับ
- ชื่อ plugin และ endpoint
- ส่วน Configuration
- ส่วน Environment Variables
- ปุ่ม `Edit`, `Save`, `Health Check`, `Enable/Disable`, `Restart`, `Export`, `Delete`

รายละเอียด field สำคัญ:

#### Name (Plugin)

- ชื่อ plugin

#### Endpoint (Plugin)

- URL ของปลายทาง plugin

#### Auth Method

- รูปแบบการยืนยันตัวตนของ plugin

#### Headers JSON

- ค่าหัวข้อ request ในรูปแบบ JSON
- ต้องเป็น JSON ที่ถูกต้อง

#### Timeout

- ค่าระยะเวลารอ response

#### Environment Variables

- key/value สำหรับ environment ของ plugin

ปุ่มและการทำงาน:

#### Edit (Plugin)

- เปิดโหมดแก้ไข field ต่าง ๆ

#### Save (Plugin)

- บันทึกค่าที่แก้ไข

#### Health Check

- ตรวจสอบสถานะของ plugin endpoint

#### Enable/Disable

- เปิดหรือปิด plugin

#### Restart

- ใช้สั่ง restart plugin

#### Export config

- ดาวน์โหลด config เป็นไฟล์ JSON

#### Delete (Plugin)

- ลบ plugin ออกจากระบบ

วิธีทดสอบ:

1. เปิด detail ของ plugin หนึ่งรายการ
2. กด `Edit`
3. แก้ค่า Name หรือ Endpoint
4. กด `Save`
5. ตรวจสอบ toast success และข้อมูลอัปเดต
6. ทดสอบกรอก JSON ผิด format ใน Headers JSON
7. ตรวจสอบว่ามีการแจ้ง validation หรือปฏิเสธการบันทึก
8. กด `Export` แล้วตรวจสอบว่าไฟล์ถูกดาวน์โหลด

## 6. Tools Management

### 6.1 หน้า Tools List

เส้นทาง:

- `/tools`

วัตถุประสงค์:

- ใช้ค้นหาและดูรายการ tools ทั้งหมด

องค์ประกอบบนหน้าจอ:

- ช่องค้นหา
- ตาราง tools
- ปุ่ม `Delete`
- pagination

รายละเอียดตาราง:

- Name
- Description
- Category
- Plugin
- Actions

วิธีทดสอบ:

1. พิมพ์คำค้นหาใน search input
2. ตรวจสอบว่าผลลัพธ์ในตารางเปลี่ยนตามคำค้นหา
3. กด `Delete` ที่แถวหนึ่งและยืนยัน
4. ตรวจสอบว่า tool ถูกลบจากตาราง

### 6.2 หน้า Tool Detail

เส้นทาง:

- `/tools/[id]`

วัตถุประสงค์:

- ใช้ดูและแก้ไขรายละเอียด tool รวมถึงทดสอบ execution

องค์ประกอบบนหน้าจอ:

- ชื่อ tool
- Description
- ส่วน Configuration
- Input Schema
- Output Schema
- Test Section

รายละเอียด field:

#### Name (Tool)

- ชื่อ tool

#### Method

- HTTP Method เช่น GET, POST, PUT, PATCH, DELETE

#### Endpoint (Tool)

- URL หรือ path ของ endpoint ที่ tool ใช้

#### Input Schema

- JSON schema สำหรับ input

#### Output Schema

- JSON schema สำหรับ output

#### Test Input

- JSON input สำหรับทดสอบเรียก tool

ปุ่มและการทำงาน:

#### Edit (Tool)

- เปิดโหมดแก้ไข

#### Save (Tool)

- บันทึกค่าที่แก้ไข

#### Format JSON

- จัด format JSON ให้สวยงาม

#### Play / Run Test

- ส่ง test input ไปทดสอบ tool

วิธีทดสอบ:

1. เปิดหน้า Tool Detail
2. กด `Edit`
3. แก้ schema หรือ endpoint
4. กด `Save`
5. ใส่ test input ที่เป็น JSON ถูกต้อง
6. กด run test
7. ตรวจสอบผลลัพธ์ว่าปรากฏในหน้าจอ
8. ทดสอบกรอก JSON ผิด format แล้วตรวจสอบ error

## 7. Tokens & Security

### 7.1 หน้า API Tokens

เส้นทาง:

- `/tokens`

วัตถุประสงค์:

- ใช้สร้างและจัดการ personal API tokens

องค์ประกอบบนหน้าจอ:

- ช่อง `Token name`
- ปุ่ม `Create Token`
- ตาราง tokens
- ปุ่ม `Revoke`
- ปุ่ม `Copy` สำหรับ token ใหม่

รายละเอียด field:

#### Token name

- ชื่อ token ที่ผู้ใช้ตั้งเอง
- ถ้าเว้นว่าง ปุ่ม create ควรถูก disable

รายละเอียดตาราง:

- Name
- Prefix
- Status
- Last Used
- Expires
- Actions

พฤติกรรมสำคัญ:

- token value จะแสดงเพียงครั้งเดียวหลังสร้างเสร็จ
- ผู้ใช้ต้อง copy ตอนนั้นทันที

วิธีทดสอบ:

1. กรอกชื่อ token
2. กด `Create Token`
3. ตรวจสอบว่ามีการแสดง token value แบบ one-time
4. กด `Copy`
5. ตรวจสอบ toast success
6. กด `Revoke` ที่ token หนึ่งรายการ
7. ตรวจสอบว่าสถานะ token เปลี่ยนตามคาด

## 8. Users & Roles

### 8.1 หน้า Users List

เส้นทาง:

- `/users`

วัตถุประสงค์:

- ใช้ดูรายชื่อผู้ใช้ทั้งหมดและเปิด/ปิดสถานะการใช้งาน

องค์ประกอบบนหน้าจอ:

- Search input
- ตาราง users
- ปุ่ม `Activate` หรือ `Deactivate`
- pagination

รายละเอียดตาราง:

- Email
- Display Name
- Roles
- MFA
- Status
- Actions

รายละเอียด badge:

- MFA Enabled / Disabled
- Active / Inactive

วิธีทดสอบ:

1. ค้นหาผู้ใช้ด้วย search input
2. ตรวจสอบว่าตารางถูกกรอง
3. กด `Deactivate` ที่ user ที่ active
4. ตรวจสอบว่าสถานะเปลี่ยนเป็น inactive
5. กด `Activate` กลับอีกครั้ง
6. ตรวจสอบว่าสถานะเปลี่ยนกลับ

### 8.2 หน้า User Detail

เส้นทาง:

- `/users/[id]`

วัตถุประสงค์:

- ใช้บริหารข้อมูลของผู้ใช้รายบุคคล

องค์ประกอบบนหน้าจอ:

- Header ชื่อผู้ใช้และสถานะ
- ส่วน Profile
- ส่วน Roles
- ส่วน Sessions
- ปุ่ม `Delete`

รายละเอียด field ในส่วน Profile:

#### Full name (User Detail)

- ชื่อผู้ใช้

#### Email (User Detail)

- อีเมลของผู้ใช้

#### Status

- Active หรือ Inactive

รายละเอียด field ในส่วน Roles:

#### Role input

- ใช้เพิ่ม role ให้ผู้ใช้

ปุ่มและการทำงาน:

#### Edit (User Detail)

- เปิดโหมดแก้ไข field profile

#### Save (User Detail)

- บันทึกข้อมูล profile

#### Cancel

- ยกเลิกการแก้ไข

#### Add Role

- เพิ่ม role ให้ user

#### Remove role

- ลบ role ออกจาก user

#### Revoke session

- ตัด session ที่ active อยู่

#### Delete user

- ลบ user ออกจากระบบ แล้วกลับไปหน้า `/users`

วิธีทดสอบ:

1. เปิดหน้า user detail
2. กด `Edit`
3. แก้ชื่อหรือ email แล้วกด `Save`
4. ตรวจสอบว่าข้อมูลเปลี่ยนจริง
5. เพิ่ม role ใหม่ผ่าน role input
6. ลองลบ role ผ่านปุ่ม remove
7. กด revoke session ที่มีอยู่
8. ตรวจสอบว่า session หายไปจากรายการ

### 8.3 หน้า My Profile

เส้นทาง:

- `/users/profile`

วัตถุประสงค์:

- ใช้จัดการข้อมูลส่วนตัวของผู้ใช้ที่ login อยู่

องค์ประกอบบนหน้าจอ:

- ส่วน Account Details
- ช่อง `Full name`
- ปุ่ม `Save profile`
- ส่วน Change Password
- ส่วน Two-Factor Authentication
- ส่วน Active Sessions

รายละเอียด field:

#### Full name (My Profile)

- ใช้แก้ชื่อที่แสดงของผู้ใช้

#### Current password

- รหัสผ่านปัจจุบัน

#### New password

- รหัสผ่านใหม่ ขั้นต่ำ 8 ตัวอักษร

#### Confirm new password

- ต้องตรงกับ New password

ปุ่มและการทำงาน:

#### Save profile

- บันทึกการเปลี่ยนชื่อ

#### Change password

- เปลี่ยนรหัสผ่าน

#### Revoke

- ตัด session ของอุปกรณ์/เบราว์เซอร์ที่แสดงในรายการ

หมายเหตุ:

- ส่วน 2FA เป็น placeholder และยังใช้งานจริงไม่ได้

วิธีทดสอบ:

1. แก้ชื่อในช่อง Full name แล้วกด `Save profile`
2. ตรวจสอบ toast success
3. ทดสอบเปลี่ยนรหัสผ่านด้วย current password ถูกต้อง
4. ทดสอบกรอก confirm password ไม่ตรงกัน
5. ตรวจสอบข้อความ error
6. กด revoke session หนึ่งรายการและตรวจสอบว่าหายไป

### 8.4 หน้า Roles & Permissions

เส้นทาง:

- `/users/roles`

วัตถุประสงค์:

- ใช้สร้าง role ใหม่และดูรายการ permissions อ้างอิงในระบบ

องค์ประกอบบนหน้าจอ:

- รายการ role cards
- ปุ่ม `New Role`
- ปุ่มลบ role
- modal สร้าง role
- ส่วน Permissions reference

รายละเอียด field ใน modal:

#### Name (Role)

- ชื่อ role
- ถ้าเว้นว่าง ปุ่ม create ควรถูก disable

#### Description

- รายละเอียด role

ปุ่มและการทำงาน:

#### New Role

- เปิด modal สร้าง role

#### Delete role

- ลบ role พร้อม confirm

วิธีทดสอบ:

1. กด `New Role`
2. กรอก Name และ Description
3. กด save/create
4. ตรวจสอบว่า role card ใหม่แสดงบนหน้า
5. กดลบ role หนึ่งรายการ
6. ตรวจสอบว่ารายการหายไป

## 9. Settings และ Environments

### 9.1 หน้า Settings

เส้นทาง:

- `/settings`

วัตถุประสงค์:

- ใช้ตั้งค่าระบบในหลายหมวดผ่าน tab

tabs ที่มี:

- General
- Security
- API Gateway
- MCP
- Notifications
- Branding
- Feature Flags

ตัวอย่าง field ตามหมวด:

#### General

- ค่าทั่วไปของระบบ เช่นชื่อเว็บไซต์, URL หรือ config เบื้องต้น

#### Security

- ค่าความปลอดภัย เช่น rate limit หรือ session timeout

#### API Gateway

- endpoint และค่าสำหรับ gateway

#### MCP

- config สำหรับ MCP integration

#### Notifications

- ค่า provider หรือ webhook ต่าง ๆ

#### Branding

- โลโก้, primary color และค่า UI branding

#### Feature Flags

- ตาราง flags พร้อมสถานะ active/inactive

ปุ่มและการทำงาน:

#### Save Changes

- บันทึกการเปลี่ยนแปลงใน tab ปัจจุบัน

พฤติกรรมสำคัญ:

- ปุ่ม save จะ disabled ถ้ายังไม่มีการแก้ไข
- boolean fields ใช้ toggle

วิธีทดสอบ:

1. เปิด tab ใด tab หนึ่ง
2. เปลี่ยนค่าหนึ่ง field
3. ตรวจสอบว่าปุ่ม `Save Changes` ถูก enable
4. กด save
5. refresh หน้าแล้วตรวจสอบว่าค่าเดิมยังอยู่

### 9.2 หน้า Environments List

เส้นทาง:

- `/settings/environments`

วัตถุประสงค์:

- ใช้สร้าง environment และเปิดดู variables ของ environment นั้น

องค์ประกอบบนหน้าจอ:

- ปุ่ม `New Environment`
- environment cards
- modal สร้าง environment

รายละเอียด field ใน modal:

#### Name (Environment)

- ชื่อ environment เช่น `Development`, `Staging`, `Production`

#### Slug

- slug ที่ระบบใช้เป็น identifier
- สามารถถูก generate จาก Name ได้

วิธีทดสอบ:

1. กด `New Environment`
2. กรอก Name
3. ตรวจสอบว่า Slug ถูกสร้างอัตโนมัติ
4. กด create
5. ตรวจสอบว่า card ใหม่แสดงในรายการ

### 9.3 หน้า Environment Detail

เส้นทาง:

- `/settings/environments/[id]`

วัตถุประสงค์:

- ใช้ดู environment variables ของ environment ที่เลือก

องค์ประกอบบนหน้าจอ:

- ชื่อหน้า `Environment Variables`
- ชื่อ id ของ environment
- ตาราง variables

รายละเอียดตาราง:

- Key
- Value
- Type

พฤติกรรมสำคัญ:

- ถ้าเป็น secret จะถูกแสดงแบบซ่อนค่า
- มีปุ่มรูปตาเพื่อสลับสถานะการเปิด/ปิดการมองเห็น
- ถ้าไม่มีตัวแปร จะแสดงข้อความ `No variables in this environment.`

วิธีทดสอบ:

1. เปิด environment หนึ่งรายการจากหน้า environments
2. ตรวจสอบว่าตารางแสดง key และ type ถูกต้อง
3. ถ้าเป็น secret ให้กดปุ่มรูปตา
4. ตรวจสอบการเปลี่ยนสถานะการแสดงผลตามที่ออกแบบ

## 10. Notifications

### 10.1 หน้า Notifications Inbox

เส้นทาง:

- `/notifications`

วัตถุประสงค์:

- ใช้ดู notification ที่ส่งเข้ามาในระบบ

องค์ประกอบบนหน้าจอ:

- ข้อความจำนวน unread
- ปุ่ม `Mark all read`
- notification cards

พฤติกรรมสำคัญ:

- notification ที่ยังไม่อ่านจะเด่นกว่ารายการที่อ่านแล้ว
- คลิกรายการที่ unread จะ mark as read
- ระบบ refetch ทุก 30 วินาที

วิธีทดสอบ:

1. เปิดหน้า notifications
2. ตรวจสอบจำนวน unread
3. คลิก notification ที่ยังไม่อ่าน
4. ตรวจสอบว่าสถานะเปลี่ยนเป็น read
5. กด `Mark all read`
6. ตรวจสอบว่าจำนวน unread ลดลงเป็น 0

### 10.2 หน้า Notification Channels

เส้นทาง:

- `/notifications/channels`

วัตถุประสงค์:

- ใช้ตั้งค่าช่องทางการส่งแจ้งเตือน เช่น SMTP, Slack, Discord, Telegram

tabs ที่มี:

- Email (SMTP)
- Slack
- Discord
- Telegram

รายละเอียด field ของแต่ละ tab:

#### SMTP

- SMTP Host
- Port
- Username
- Password
- From Address
- ปุ่ม `Save SMTP`

#### Slack

- Webhook URL
- ปุ่ม `Save Slack`

#### Discord

- Webhook URL
- ปุ่ม `Save Discord`

#### Telegram

- Bot Token
- Chat ID
- ปุ่ม `Save Telegram`

วิธีทดสอบ:

1. เปิด tab SMTP
2. กรอกค่า host, port, user, pass, from
3. กด `Save SMTP`
4. ตรวจสอบ toast success
5. สลับไป Slack หรือ Discord แล้วกรอก webhook URL
6. กด save และตรวจสอบว่า config ถูกบันทึก

### 10.3 หน้า Notification Rules

เส้นทาง:

- `/notifications/rules`

วัตถุประสงค์:

- ใช้สร้าง rule การแจ้งเตือนตาม event ต่าง ๆ

องค์ประกอบบนหน้าจอ:

- ปุ่ม `Add Rule`
- รายการ rules
- ปุ่ม toggle enable/disable
- ปุ่ม `Edit`
- ปุ่มลบ
- modal สำหรับสร้าง/แก้ไข rule

รายละเอียด field ใน modal:

#### Event Type

- ตัวอย่างค่า: `plugin.failure`, `mcp.disconnect`, `auth.failure`, `latency.high`, `token.expiry`, `security.alert`

#### Threshold

- ค่าเชิงตัวเลขแบบ optional เช่น latency threshold

#### Channels

- เลือกได้หลายค่า เช่น `email`, `slack`, `discord`, `telegram`, `in_app`
- ต้องเลือกอย่างน้อย 1 ค่า

ปุ่มและการทำงาน:

#### Save (Notification Rule)

- บันทึก rule ใหม่หรือ rule ที่แก้ไข

#### Toggle

- เปิดหรือปิด rule

#### Delete (Notification Rule)

- ลบ rule

วิธีทดสอบ:

1. กด `Add Rule`
2. เลือก Event Type
3. กรอก Threshold ถ้าต้องการ
4. เลือก channels อย่างน้อย 1 ค่า
5. กด `Save`
6. ตรวจสอบว่า rule ใหม่แสดงในรายการ
7. กด toggle เพื่อปิด rule แล้วเปิดใหม่
8. กด `Edit` แก้ค่า threshold แล้วบันทึก

## 11. Logs & Monitoring

### 11.1 หน้า Logs

เส้นทาง:

- `/logs`

วัตถุประสงค์:

- ใช้ดู audit logs, system logs และ execution logs

tabs ที่มี:

- Audit
- System
- Execution

องค์ประกอบบนหน้าจอ:

- Search input
- Level filter ใน tab System
- ตาราง logs
- pagination

รายละเอียด tab:

#### Audit

- คอลัมน์ Time, User, Action, Resource

#### System

- คอลัมน์ Time, Level, Message
- Level มีสีตามชนิด เช่น ERROR แดง, WARN เหลือง, INFO น้ำเงิน

#### Execution

- คอลัมน์ Time, Status, Plugin, Duration

วิธีทดสอบ:

1. เปิดหน้า Logs
2. สลับระหว่างแท็บ Audit, System, Execution
3. พิมพ์คำค้นหาใน search
4. ตรวจสอบผลลัพธ์ในตาราง
5. ใน System tab ให้เปลี่ยน level filter
6. ตรวจสอบว่ารายการถูกกรองตาม level

## 12. AXON System

### 12.1 หน้า AXON System Overview

เส้นทาง:

- `/axon`

วัตถุประสงค์:

- ใช้ดูภาพรวม activity ของ orchestrator runs และ AI agent runs

องค์ประกอบบนหน้าจอ:

- KPI cards
- tabs `Orchestrator Runs` และ `AI Agent Runs`
- ตาราง runs

รายละเอียดสำคัญ:

- status badges มีสีตามสถานะ เช่น done, running, pending, error, hitl_pending
- prompt ของ orchestrator run เป็นลิงก์ไปหน้า detail

วิธีทดสอบ:

1. เปิดหน้า AXON System
2. สลับ tab ระหว่าง orchestrator และ AI agent
3. ตรวจสอบว่าตารางเปลี่ยนตาม tab
4. คลิก prompt ของ orchestrator run
5. ตรวจสอบว่าระบบพาไปหน้า detail ได้

### 12.2 หน้า Orchestrator Run Detail

เส้นทาง:

- `/axon/orchestrator?id=[id]`

วัตถุประสงค์:

- ใช้ดูรายละเอียด pipeline ของ orchestrator run ทีละ stage

องค์ประกอบบนหน้าจอ:

- status badge
- metadata cards เช่น model, duration, tokens, user
- full prompt
- stage cards
- output JSON แบบ collapsible

วิธีทดสอบ:

1. เปิดหน้า detail จาก AXON overview
2. ตรวจสอบว่าข้อมูล run metadata แสดงครบ
3. เปิด/ปิด collapse ของ output JSON ในแต่ละ stage
4. ถ้า run ยัง running ให้ตรวจสอบ auto refresh ทุก 3 วินาที

### 12.3 หน้า HITL Queue

เส้นทาง:

- `/axon/hitl`

วัตถุประสงค์:

- ใช้ approve หรือ reject งานที่รอ human approval

องค์ประกอบบนหน้าจอ:

- tabs `Pending`, `Approved`, `Rejected`
- cards ของแต่ละ run
- ปุ่ม `Approve`, `Reject`, `Note`
- note textarea

รายละเอียด field:

#### Note textarea

- ใช้ใส่หมายเหตุเพิ่มเติมก่อน approve หรือ reject

วิธีทดสอบ:

1. เปิด tab Pending
2. กด `Note` ในรายการหนึ่ง
3. ใส่ข้อความ note
4. กด `Approve` หรือ `Reject`
5. ตรวจสอบว่ารายการย้ายออกจาก Pending
6. เปิด tab Approved หรือ Rejected เพื่อตรวจสอบผล

### 12.4 หน้า Experience Ledger

เส้นทาง:

- `/axon/experience`

วัตถุประสงค์:

- ใช้ดูประวัติ orchestration runs ที่เสร็จสมบูรณ์

องค์ประกอบบนหน้าจอ:

- Search input
- KPI cards
- cards ของแต่ละ run
- collapse สำหรับรายละเอียด stage
- pagination

วิธีทดสอบ:

1. ค้นหาด้วย prompt keyword
2. ตรวจสอบว่ารายการถูกกรอง
3. เปิดรายละเอียดของ run หนึ่งรายการ
4. ตรวจสอบข้อมูล stage, model, duration, tokens

### 12.5 หน้า Supply Chain Plan

เส้นทาง:

- `/axon/supply-chain`

วัตถุประสงค์:

- ใช้ดูข้อมูล demand, supply และ allocation แบบ read-only

tabs ที่มี:

- Demand
- Supply
- Allocation

รายละเอียดตาราง:

#### Demand

- SKU
- Period
- Quantity
- Unit
- Confidence %

#### Supply

- SKU
- Supplier
- Available Qty
- Lead Time Days
- Cost

#### Allocation

- SKU
- Source
- Destination
- Allocated Qty
- Status

วิธีทดสอบ:

1. เปิดแต่ละ tab
2. ตรวจสอบว่าตารางเปลี่ยนตามหมวด
3. ตรวจสอบว่าไม่มี field editable หรือปุ่ม save

## 13. Testing Console

### 13.1 หน้า MCP Testing Console

เส้นทาง:

- `/testing`

วัตถุประสงค์:

- ใช้เป็นหน้าหลักของการทดสอบ request ต่าง ๆ ในระบบ

องค์ประกอบบนหน้าจอ:

- ปุ่ม `Open MCP Agents Testing`
- Search input
- ตาราง test requests
- ปุ่ม `Run`
- ปุ่ม `Delete`
- กล่อง Last Execution Result

รายละเอียดตาราง:

- Name
- Protocol
- Method
- Endpoint
- Collection
- Actions

วิธีทดสอบ:

1. ค้นหาด้วย search input
2. กด `Run` บน request หนึ่งรายการ
3. ตรวจสอบว่าผลลัพธ์แสดงใน `Last Execution Result`
4. กด `Delete` แล้วตรวจสอบว่ารายการหายไป
5. กด `Open MCP Agents Testing` เพื่อตรวจสอบ routing

หมายเหตุ:

- คู่มือของหน้า `MCP Agents Testing` อยู่ในไฟล์แยก

### 13.2 หน้า Orchestrator Testing

เส้นทาง:

- `/testing/orchestrator`

วัตถุประสงค์:

- ใช้ทดสอบ orchestrator pipeline แบบ interactive

องค์ประกอบบนหน้าจอ:

- Prompt input
- Model selector
- ปุ่ม Run/Play
- ปุ่ม Stop
- ปุ่ม Download results
- Stage visualization
- Run history

รายละเอียด field:

#### Prompt (Orchestrator Testing)

- ข้อความคำสั่งหรือโจทย์สำหรับทดสอบ pipeline

#### Model selector

- เลือก model ที่ใช้รัน

วิธีทดสอบ:

1. กรอก prompt
2. เลือก model
3. กด run
4. ตรวจสอบว่า stage ต่าง ๆ เปลี่ยนสถานะแบบ real-time
5. เปิดดู JSON input/output ในแต่ละ stage
6. ดาวน์โหลดผลลัพธ์ถ้ามีปุ่มให้ใช้งาน

### 13.3 หน้า Pydantic AI Testing

เส้นทาง:

- `/testing/pydantic-ai`

วัตถุประสงค์:

- ใช้ทดสอบ Pydantic AI agents และดู message flow

องค์ประกอบบนหน้าจอ:

- Agent selector
- Prompt textarea
- Message viewer
- History
- ปุ่ม Run, Stop, Download

รายละเอียด field:

#### Agent selector

- เลือก agent ที่ต้องการทดสอบ

#### Prompt (Pydantic AI Testing)

- ข้อความ input สำหรับส่งให้ agent

รายละเอียด message card:

- ชนิดของ message เช่น user-prompt, tool-call, tool-return, text, retry-prompt
- แสดง content แบบ text หรือ formatted JSON
- แสดง token counts

วิธีทดสอบ:

1. เลือก agent
2. ใส่ prompt
3. กด run
4. ตรวจสอบว่ามี message cards แสดงตามลำดับ
5. เปิด/ปิดรายละเอียดในแต่ละ message
6. ตรวจสอบ token counts และชนิดของ message

## 14. Root Route

### 14.1 หน้า Root

เส้นทาง:

- `/`

พฤติกรรม:

- redirect ไป `/dashboard` อัตโนมัติ

วิธีทดสอบ:

1. เปิด root URL ของระบบ
2. ตรวจสอบว่าถูกพาไปหน้า `/dashboard`

## 15. ตารางสรุปหน้าจอทั้งหมด

| หน้าจอ | Route | จุดประสงค์หลัก | ปุ่ม/การทำงานหลัก |
| --- | --- | --- | --- |
| Login | `/login` | เข้าสู่ระบบ | Sign In |
| Register | `/register` | สมัครสมาชิก | Create Account |
| Forgot Password | `/forgot-password` | ขอรีเซ็ตรหัสผ่าน | Send reset link |
| Dashboard | `/dashboard` | ดูภาพรวมระบบ | ดู KPI และกราฟ |
| Plugins | `/plugins` | จัดการ plugin | Search, Health, Delete |
| Plugin Detail | `/plugins/[id]` | แก้ config plugin | Edit, Save, Health Check |
| Tools | `/tools` | ดูรายการ tools | Search, Delete |
| Tool Detail | `/tools/[id]` | แก้ config tool และ test | Edit, Save, Run Test |
| Tokens | `/tokens` | สร้าง token | Create, Copy, Revoke |
| Users | `/users` | จัดการผู้ใช้ | Search, Activate/Deactivate |
| User Detail | `/users/[id]` | แก้ข้อมูลผู้ใช้ | Save, Add Role, Revoke Session |
| My Profile | `/users/profile` | จัดการข้อมูลตนเอง | Save profile, Change password |
| Roles | `/users/roles` | จัดการ roles | New Role, Delete |
| Settings | `/settings` | ตั้งค่าระบบ | Save Changes |
| Environments | `/settings/environments` | จัดการ environments | New Environment |
| Environment Detail | `/settings/environments/[id]` | ดู environment vars | ดู/ซ่อนค่า secret |
| Notifications | `/notifications` | อ่าน notifications | Mark all read |
| Notification Channels | `/notifications/channels` | ตั้งค่าช่องทางส่งแจ้งเตือน | Save SMTP/Slack/Discord/Telegram |
| Notification Rules | `/notifications/rules` | ตั้ง rule แจ้งเตือน | Add Rule, Toggle, Edit, Delete |
| Logs | `/logs` | ดู logs | Search, Filter |
| AXON System | `/axon` | ดู runs ของระบบ AXON | เปิด detail |
| Orchestrator Detail | `/axon/orchestrator?id=...` | ดู stage ของ run | เปิด output JSON |
| HITL Queue | `/axon/hitl` | อนุมัติหรือปฏิเสธงาน | Approve, Reject, Note |
| Experience Ledger | `/axon/experience` | ดูประวัติ runs | Search, Expand |
| Supply Chain | `/axon/supply-chain` | ดูข้อมูล plan แบบ read-only | สลับ tabs |
| Testing Console | `/testing` | รันทดสอบ requests | Run, Delete |
| Orchestrator Testing | `/testing/orchestrator` | ทดสอบ orchestrator | Run, Stop, Download |
| Pydantic AI Testing | `/testing/pydantic-ai` | ทดสอบ AI agents | Run, Stop, Download |
| MCP Agents Testing | `/testing/mcp-agents` | คู่มือแยก | ดูไฟล์คู่มือเฉพาะ |

## 16. ชุดทดสอบ UAT แนะนำระดับระบบ

1. Login ด้วยผู้ใช้ admin แล้วเข้าหน้า Dashboard ได้
2. เปิดหน้า Plugins, Tools, Users, Tokens และ Logs ได้ครบ
3. ทดสอบอย่างน้อย 1 mutation ต่อหมวด เช่น save, delete, revoke, toggle
4. ทดสอบ notification settings และ notification rules
5. ทดสอบ AXON overview และ HITL queue
6. ทดสอบ testing pages ทั้ง orchestrator และ pydantic-ai
7. ทดสอบ routing ไปยังหน้า detail เช่น plugin detail, tool detail, user detail, orchestrator detail

## 17. หมายเหตุสำหรับทีมเอกสารและ QA

ข้อสังเกต:

- บางหน้าจอเป็น read-only จึงไม่มี field ให้แก้ไข
- บาง action มี confirm dialog ก่อนลบหรือ revoke
- หลายหน้ามี auto-refetch และ loading skeleton
- หน้า `MCP Agents Testing` ถูกแยกคู่มือไว้ต่างหากเพราะมีรายละเอียดเฉพาะด้าน MCP Inspector มากกว่าหน้าอื่น

ถ้าต้องการขยายเอกสารต่อ สามารถแยกเป็นคู่มือรายหมวดได้ เช่น:

- คู่มือผู้ดูแลระบบ
- คู่มือ QA/UAT
- คู่มือ Security & Token Operations
- คู่มือ AXON System Monitoring
