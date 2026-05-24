# คู่มือ AXON Operations ภาษาไทย

เอกสารนี้ออกแบบสำหรับทีมที่ต้องติดตามการทำงานของ AXON system, orchestrator, HITL queue, experience ledger และหน้าจอทดสอบเชิงปฏิบัติการ

เอกสารอ้างอิงที่เกี่ยวข้อง:

- คู่มือรวม: [docs/USER_MANUAL_AXON_ADMIN_TH.md](/u01/axon-admin/docs/USER_MANUAL_AXON_ADMIN_TH.md)
- คู่มือ MCP Inspector: [docs/USER_MANUAL_MCP_AGENTS_TESTING_TH.md](/u01/axon-admin/docs/USER_MANUAL_MCP_AGENTS_TESTING_TH.md)

## 1. หน้าจอหลักของ AXON Operations

ทีม AXON Operations จะใช้งานหน้าจอเหล่านี้เป็นหลัก:

1. Dashboard
2. AXON System Overview
3. Orchestrator Run Detail
4. HITL Queue
5. Experience Ledger
6. Supply Chain Plan
7. Testing Console
8. Orchestrator Testing
9. Pydantic AI Testing
10. MCP Agents Testing

## 2. Dashboard สำหรับงานปฏิบัติการ

Route:

- `/dashboard`

จุดที่ควรเฝ้าดู:

- `Total Requests`
- `Error Rate`
- กราฟ Daily Request Volume
- กราฟ Requests vs Errors

การใช้งาน:

1. เปิด Dashboard ตอนเริ่มรอบงาน
2. ตรวจแนวโน้ม request และ errors
3. ถ้า error rate สูงผิดปกติ ให้ drill down ต่อที่ Logs และ AXON pages

## 3. AXON System Overview

Route:

- `/axon`

วัตถุประสงค์:

- ใช้ดูภาพรวม orchestrator runs และ AI agent runs

องค์ประกอบสำคัญ:

- KPI cards
- tab `Orchestrator Runs`
- tab `AI Agent Runs`
- status badges
- ลิงก์ไป orchestrator detail

ความหมายของ status ที่พบบ่อย:

- `done` หมายถึงงานจบสำเร็จ
- `running` หมายถึงกำลังประมวลผล
- `pending` หมายถึงรอเริ่มหรือรอ step ถัดไป
- `error` หมายถึงงานล้มเหลว
- `hitl_pending` หมายถึงรอ human approval

การใช้งาน:

1. เปิด tab orchestrator เพื่อตรวจ run ล่าสุด
2. ดู token usage และ duration ประกอบการวิเคราะห์
3. คลิก prompt เพื่อเปิดหน้ารายละเอียด run

## 4. Orchestrator Run Detail

Route:

- `/axon/orchestrator?id=[id]`

วัตถุประสงค์:

- ใช้ดู pipeline แบบละเอียดทีละ stage

องค์ประกอบสำคัญ:

- status badge ของ run
- model, duration, tokens, user
- full prompt
- stage cards
- output JSON แบบ collapsible

วิธีอ่าน stage cards:

1. ดูหมายเลข stage
2. ดูชื่อ stage
3. ดู status ของ stage นั้น
4. ถ้า stage error ให้ดู error message และ output JSON
5. ถ้า stage ยัง running ให้รอ auto-refresh

กรณีใช้งานจริง:

- ใช้หา stage ที่ทำให้ run fail
- ใช้ดูว่าปัญหาเกิดจาก input, tool execution หรือ output handling

## 5. HITL Queue

Route:

- `/axon/hitl`

วัตถุประสงค์:

- ใช้อนุมัติหรือปฏิเสธงานที่ถูก pause เพื่อรอคนตัดสินใจ

tabs หลัก:

- `Pending`
- `Approved`
- `Rejected`

องค์ประกอบสำคัญ:

- prompt snippet
- run ID
- timestamp
- stage ที่ค้าง
- ปุ่ม `Approve`
- ปุ่ม `Reject`
- ปุ่ม `Note`
- note textarea

วิธีใช้งาน:

1. เปิด tab `Pending`
2. อ่าน prompt และข้อมูล stage ที่ค้าง
3. ถ้าต้องการใส่หมายเหตุ ให้กด `Note`
4. กรอก note เพิ่มเติม
5. กด `Approve` หรือ `Reject`
6. ตรวจสอบว่ารายการย้ายไปแท็บที่ถูกต้อง

แนวปฏิบัติ:

- ถ้าปฏิเสธ ควรกรอก note เพื่ออธิบายเหตุผล
- ตรวจสอบ run ที่ค้างเป็นระยะ เพราะหน้า refetch ทุก 10 วินาที

## 6. Experience Ledger

Route:

- `/axon/experience`

วัตถุประสงค์:

- ใช้ดูประวัติ orchestration runs ที่เสร็จสิ้นแล้ว

องค์ประกอบสำคัญ:

- Search input
- KPI cards
- run cards
- stage details แบบ expand/collapse
- pagination

การใช้งาน:

1. ค้นหาจาก keyword ใน prompt
2. เปิด run card ที่สนใจ
3. ดู model, duration, token count และ stage breakdown
4. ใช้เทียบผลลัพธ์กับ run ใหม่ที่เกิดปัญหา

## 7. Supply Chain Plan

Route:

- `/axon/supply-chain`

วัตถุประสงค์:

- ใช้ดูข้อมูลจาก `axon_plan` แบบ read-only

tabs หลัก:

- `Demand`
- `Supply`
- `Allocation`

การตีความข้อมูล:

### Demand

- ดูปริมาณความต้องการตาม SKU และช่วงเวลา

### Supply

- ดูแหล่ง supply, lead time และ cost

### Allocation

- ดูการจัดสรรจาก source ไป destination พร้อม status

หน้าจอนี้เป็น read-only:

- ไม่มีปุ่ม save
- ไม่มี field แก้ไข

## 8. Testing Console

### MCP Testing Console

Route:

- `/testing`

วัตถุประสงค์:

- ใช้เป็นหน้ารวมสำหรับ execute test requests

องค์ประกอบสำคัญ:

- Search input
- ตาราง test requests
- ปุ่ม `Run`
- ปุ่ม `Delete`
- ปุ่ม `Open MCP Agents Testing`
- กล่อง `Last Execution Result`

การใช้งาน:

1. ค้นหา request ที่ต้องการทดสอบ
2. กด `Run`
3. ตรวจผลใน `Last Execution Result`
4. ถ้าต้อง debug MCP ระดับ Inspector ให้กด `Open MCP Agents Testing`

### Orchestrator Testing

Route:

- `/testing/orchestrator`

ฟิลด์สำคัญ:

- `Prompt`
- `Model selector`

ปุ่มสำคัญ:

- `Play`
- `Stop`
- `Download`

การใช้งาน:

1. กรอก prompt
2. เลือก model
3. กด run
4. ติดตาม stage status แบบ real-time
5. เปิดดู input/output JSON ของแต่ละ stage

### Pydantic AI Testing

Route:

- `/testing/pydantic-ai`

ฟิลด์สำคัญ:

- `Agent selector`
- `Prompt`

องค์ประกอบสำคัญ:

- message cards
- token counts
- history

การใช้งาน:

1. เลือก agent
2. กรอก prompt
3. กด run
4. ติดตามลำดับ message เช่น user-prompt, tool-call, tool-return, text
5. ใช้ข้อมูลนี้วิเคราะห์ behavior ของ agent

### MCP Agents Testing

Route:

- `/testing/mcp-agents`

คู่มือเฉพาะ:

- [docs/USER_MANUAL_MCP_AGENTS_TESTING_TH.md](/u01/axon-admin/docs/USER_MANUAL_MCP_AGENTS_TESTING_TH.md)

ใช้สำหรับ:

- เปิด MCP Inspector
- preload config สำหรับ Streamable HTTP, SSE และ stdio
- debug MCP servers แบบ embedded หรือเปิดแท็บใหม่

## 9. เช็กลิสต์สำหรับทีม AXON Operations

1. เริ่มจาก Dashboard เพื่อตรวจ trend โดยรวม
2. เปิด `/axon` เพื่อตรวจ run ล่าสุด
3. ถ้ามี `hitl_pending` ให้เข้า `/axon/hitl`
4. ถ้ามี run ที่ fail ให้เปิด detail ที่ `/axon/orchestrator?id=...`
5. ถ้าต้องทดสอบซ้ำแบบ interactive ให้ใช้ `/testing/orchestrator`
6. ถ้าต้องตรวจ message flow ของ AI agents ให้ใช้ `/testing/pydantic-ai`
7. ถ้าต้อง debug MCP transport หรือ server capability ให้ใช้ `/testing/mcp-agents`
