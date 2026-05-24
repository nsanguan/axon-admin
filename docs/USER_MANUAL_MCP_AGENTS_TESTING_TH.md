# คู่มือผู้ใช้งาน MCP Agents Testing

เอกสารนี้อธิบายการใช้งานหน้าจอ `MCP Agents Testing` ในระบบ AXON Admin สำหรับเปิดใช้งาน MCP Inspector, กำหนดค่าการเชื่อมต่อ, ทดสอบ MCP Server และตรวจสอบผลลัพธ์แบบฝังในหน้าเว็บ

เส้นทางหน้าจอ:

- `Testing Console` > `MCP Agents Testing`
- URL: `/testing/mcp-agents`

## 1. วัตถุประสงค์ของหน้าจอ

หน้าจอนี้ใช้สำหรับ:

- เปิด MCP Inspector โดยไม่ต้องออกจาก AXON Admin
- เตรียมค่าเชื่อมต่อของ MCP Server ล่วงหน้า
- ทดสอบได้ทั้ง `Streamable HTTP`, `SSE` และ `stdio`
- เปิด Inspector ในแท็บใหม่ หรือฝังในหน้าเดียวกัน
- คัดลอกคำสั่งสำหรับเริ่ม MCP Inspector ได้ทันที

## 2. สิ่งที่ต้องเตรียมก่อนทดสอบ

ก่อนใช้งาน ควรเตรียมสิ่งต่อไปนี้:

1. ติดตั้ง dependencies ของโปรเจกต์เรียบร้อยแล้ว
2. เปิด AXON Admin ได้ตามปกติ
3. มี MCP Server ที่พร้อมให้เชื่อมต่ออย่างน้อย 1 แบบ
4. ถ้าจะใช้ MCP Inspector แบบ local ให้รันคำสั่งนี้จาก root ของโปรเจกต์

```bash
pnpm mcp:inspector
```

ค่าเริ่มต้นของ MCP Inspector:

- UI Port: `6274`
- Proxy Port: `6277`

## 3. ภาพรวมส่วนประกอบบนหน้าจอ

หน้าจอแบ่งเป็น 5 ส่วนหลัก:

1. ส่วนหัวของหน้าจอ
2. กล่อง `Inspector Connection`
3. กล่อง `Run Inspector In This Project`
4. กล่อง `Inspector URL Preview` และ `AXON Workflow`
5. ส่วน `Embedded MCP Inspector`

## 4. คำอธิบายแต่ละฟิลด์บนหน้าจอ

### 4.1 ส่วนหัวหน้าจอ

หัวข้อหลัก:

- `MCP Inspector Workspace` แสดงว่าเป็นพื้นที่ทำงานสำหรับเชื่อมกับ MCP Inspector
- `MCP Agents Testing` คือชื่อหน้าจอสำหรับใช้งานและทดสอบ MCP Agent

ปุ่มในส่วนหัว:

#### ปุ่ม `Copy URL`

ใช้คัดลอก URL ของ MCP Inspector ที่ระบบประกอบจากค่าฟิลด์ด้านล่างให้พร้อมใช้งาน

เหมาะสำหรับ:

- ส่งลิงก์ให้ทีมงาน
- เปิด MCP Inspector ในเบราว์เซอร์อื่น
- นำ URL ไปบันทึกในเอกสารหรือ ticket

#### ปุ่ม `Open Inspector`

ใช้เปิด MCP Inspector ในแท็บใหม่ โดยจะส่งค่าที่กำหนดไว้ในหน้าจอไปเป็น query parameters ให้กับ Inspector อัตโนมัติ

เหมาะสำหรับ:

- การทดสอบแบบเต็มหน้าจอ
- กรณี iframe ถูกบล็อกไม่ให้ฝังในหน้าเว็บ

### 4.2 กล่อง Inspector Connection

ส่วนนี้เป็นหัวใจหลักของการกำหนดค่าการเชื่อมต่อ

#### ฟิลด์ `Inspector UI URL`

หน้าที่:

- ระบุ URL ของ MCP Inspector UI ที่ต้องการเปิด

ค่าตัวอย่าง:

- `http://localhost:6274`
- `http://202.71.1.13:6274`

คำอธิบาย:

- ถ้ารัน Inspector ในเครื่องเดียวกับเบราว์เซอร์ มักใช้ `http://localhost:6274`
- ถ้าเปิดจากเครื่องอื่นหรือผ่าน server กลาง ให้กรอก URL ที่เข้าถึงได้จริง

ข้อควรระวัง:

- ถ้ากรอกพอร์ตผิด จะเปิดหน้า Inspector ไม่ได้
- ถ้าใช้ URL ที่เข้าจากเครือข่ายภายนอก ควรเปิด auth token ไว้เสมอ

#### ฟิลด์ `Proxy Session Token`

หน้าที่:

- ระบุ token ที่ MCP Inspector แสดงตอนเริ่มต้น เพื่อให้หน้า Inspector เชื่อมกับ proxy ได้อย่างปลอดภัย

ตัวอย่าง:

- `3a1c267fad21f7150b7d624c160b7f09b0b8c4f623c7107bbf13378f051538d4`

คำอธิบาย:

- ถ้า MCP Inspector เปิด auth ไว้ ระบบจะต้องใช้ token นี้
- ถ้าไม่กรอก อาจเปิดหน้า Inspector ได้ แต่ใช้งาน proxy ไม่ได้ในบางกรณี

ข้อควรระวัง:

- ห้ามเผยแพร่ token นี้ในช่องทางสาธารณะ
- ถ้าเปลี่ยน token ต้องกรอกค่าใหม่ก่อนกดโหลด Inspector

#### ฟิลด์ `Transport`

หน้าที่:

- เลือกรูปแบบการเชื่อมต่อ MCP Server

ตัวเลือก:

- `Streamable HTTP`
- `SSE`
- `Stdio`

คำอธิบายแต่ละค่า:

##### `Streamable HTTP`

ใช้สำหรับ MCP Server ที่เปิด endpoint แบบ HTTP เช่น:

- `http://localhost:8000/mcp`

เหมาะกับ:

- MCP Server รุ่นใหม่ที่รองรับ transport แบบ HTTP
- การเชื่อมผ่าน reverse proxy หรือ nginx

##### `SSE`

ใช้สำหรับ MCP Server ที่เปิด endpoint แบบ Server-Sent Events เช่น:

- `http://localhost:8000/sse`

เหมาะกับ:

- MCP Server ที่รองรับการ stream ข้อมูลกลับแบบ event

##### `Stdio`

ใช้สำหรับ MCP Server ที่ต้องรันเป็น process ภายในเครื่องผ่าน command line เช่น:

- `node build/index.js`
- `npx @modelcontextprotocol/server-everything`

เหมาะกับ:

- local development
- การทดสอบ MCP Server ที่ยังไม่เปิด endpoint แบบ network

#### ฟิลด์ `MCP Server URL`

ฟิลด์นี้จะแสดงเมื่อเลือก `Streamable HTTP` หรือ `SSE`

หน้าที่:

- ระบุ URL ของ MCP Server ที่จะเชื่อมต่อ

ตัวอย่างสำหรับ `Streamable HTTP`:

- `http://localhost:8000/mcp`
- `https://mcp.example.com/mcp`

ตัวอย่างสำหรับ `SSE`:

- `http://localhost:8000/sse`
- `https://mcp.example.com/sse`

ข้อควรระวัง:

- ถ้าเว้นว่าง ระบบจะแจ้ง error ว่า `Enter an MCP server URL first`
- ต้องใส่ path ให้ตรงกับ server จริง เช่น `/mcp` หรือ `/sse`

#### ฟิลด์ `Server Command`

ฟิลด์นี้จะแสดงเมื่อเลือก `Stdio`

หน้าที่:

- ระบุคำสั่งหลักที่ใช้เริ่ม MCP Server

ตัวอย่าง:

- `npx`
- `node`
- `python`

คำแนะนำ:

- ถ้าใช้ package จาก npm ให้เริ่มด้วย `npx`
- ถ้าเป็น build output ในเครื่อง ให้ใช้ `node`

ข้อควรระวัง:

- ถ้าเว้นว่าง ระบบจะแจ้ง error ว่า `Enter a server command first`

#### ฟิลด์ `Server Args`

ฟิลด์นี้จะแสดงเมื่อเลือก `Stdio`

หน้าที่:

- ใส่ arguments ที่จะส่งต่อให้คำสั่งใน `Server Command`

ตัวอย่าง:

- `@modelcontextprotocol/server-everything`
- `build/index.js`
- `build/index.js --debug`

คำอธิบาย:

- ถ้า `Server Command = npx` และ `Server Args = @modelcontextprotocol/server-everything`
  ระบบจะตีความเป็นการรัน server ผ่าน `npx @modelcontextprotocol/server-everything`

### 4.3 ปุ่มในกล่อง Inspector Connection

#### ปุ่ม `Load Embedded Inspector`

หน้าที่:

- โหลด MCP Inspector ลงในส่วน iframe ด้านล่างของหน้า

พฤติกรรม:

- ถ้าค่า config ครบ ระบบจะสร้าง URL และโหลด Inspector ให้ทันที
- ถ้าค่า URL ของ MCP Server ยังไม่ครบในโหมด `Streamable HTTP` หรือ `SSE` จะขึ้น error

เหมาะสำหรับ:

- ทำงานในหน้าเดียว
- ทดสอบและดูผลลัพธ์โดยไม่สลับแท็บ

#### ปุ่ม `Refresh Embed`

หน้าที่:

- reload iframe ใหม่ตาม URL ที่ระบบสร้างล่าสุด

เหมาะสำหรับ:

- หลังจากแก้ค่าฟิลด์แล้วต้องการ reload Inspector ใหม่
- ใช้กรณี Inspector ค้างหรือแสดงค่าจาก session เก่า

### 4.4 กล่อง Run Inspector In This Project

ส่วนนี้แสดงคำสั่งพร้อมใช้งาน

#### ส่วน `Safe local launch`

แสดงคำสั่ง:

```bash
pnpm mcp:inspector
```

หน้าที่:

- ใช้เปิด MCP Inspector แบบ local บนเครื่องที่รันโปรเจกต์

เหมาะสำหรับ:

- dev ภายในเครื่อง
- ทดสอบแบบไม่เปิด public interface

ปุ่ม `Copy`:

- คัดลอกคำสั่งไปวางใน terminal ได้ทันที

#### ส่วน `Remote / embedded launch`

แสดงคำสั่งลักษณะนี้:

```bash
HOST=0.0.0.0 MCP_AUTO_OPEN_ENABLED=false npx @modelcontextprotocol/inspector
```

หรือถ้ามี token:

```bash
HOST=0.0.0.0 MCP_AUTO_OPEN_ENABLED=false MCP_PROXY_AUTH_TOKEN=<token> npx @modelcontextprotocol/inspector
```

หน้าที่:

- ใช้ในกรณีต้องการให้หน้า AXON Admin ที่เปิดจากเครื่องอื่นเข้าถึง MCP Inspector ได้

ข้อควรระวัง:

- `HOST=0.0.0.0` ทำให้ Inspector เปิดรับจากเครือข่ายภายนอก
- ควรใช้เฉพาะใน network ที่เชื่อถือได้
- ควรมี token และ reverse proxy ป้องกันเสมอ

### 4.5 กล่องคำเตือนด้านความปลอดภัย

หัวข้อ `Remote binding is powerful and risky.`

ความหมาย:

- MCP Inspector สามารถ spawn local process ได้
- ถ้าเปิดให้เข้าถึงจาก network ภายนอกโดยไม่มีการป้องกัน อาจเกิดความเสี่ยงด้านความปลอดภัยสูง

แนวทางที่แนะนำ:

- เปิดใช้งาน session token ทุกครั้ง
- อย่า expose port ตรงสู่ public internet ถ้าไม่จำเป็น
- ใช้ nginx/reverse proxy พร้อม allowlist หรือ auth เพิ่มเติม

### 4.6 กล่อง Inspector URL Preview

หน้าที่:

- แสดง URL ที่ระบบสร้างจากค่าฟิลด์ทั้งหมด
- URL นี้จะถูกใช้เมื่อกด `Copy URL`, `Open Inspector`, และ `Load Embedded Inspector`

ประโยชน์:

- ตรวจสอบก่อนใช้งานว่า query parameters ถูกต้อง
- ใช้ debug กรณี Inspector เปิดด้วยค่าผิด

### 4.7 กล่อง AXON Workflow

หน้าที่:

- แสดงขั้นตอนการใช้งานแบบย่อ

มีลิงก์เอกสาร MCP Inspector อยู่ด้านล่างสำหรับอ่านรายละเอียดเพิ่มเติม

### 4.8 ส่วน Embedded MCP Inspector

หน้าที่:

- ใช้แสดง MCP Inspector ภายใน iframe ของ AXON Admin

พฤติกรรม:

- ถ้ายังไม่กดโหลด จะเห็นข้อความ `No Inspector session loaded yet`
- ถ้าโหลดสำเร็จ จะเห็นหน้า MCP Inspector จริงในส่วนนี้

ข้อจำกัด:

- บาง deployment อาจถูกบล็อกด้วย header เช่น `X-Frame-Options` หรือ CSP
- ถ้า iframe ใช้ไม่ได้ ให้กด `Open Inspector` แทน

## 5. ข้อมูลที่ระบบบันทึกอัตโนมัติ

หน้าจอนี้ใช้ local storage ชื่อ:

- `axon-mcp-inspector-config-v1`

สิ่งที่ถูกบันทึก:

- Inspector UI URL
- Proxy Session Token
- Transport
- MCP Server URL
- Server Command
- Server Args

ผลลัพธ์:

- เมื่อเปิดหน้าเดิมอีกครั้ง ค่าที่เคยกรอกจะกลับมาอัตโนมัติ

## 6. วิธีทดสอบแบบทีละขั้นตอน

### กรณีที่ 1: ทดสอบ Streamable HTTP

ใช้เมื่อ MCP Server เปิด endpoint เช่น `/mcp`

ขั้นตอน:

1. เปิด terminal ที่ root ของโปรเจกต์
2. รันคำสั่ง

```bash
pnpm mcp:inspector
```

1. เปิดหน้า `MCP Agents Testing`
2. กรอก `Inspector UI URL` เป็น `http://localhost:6274`
3. ถ้ามี token ให้กรอกใน `Proxy Session Token`
4. เลือก `Transport = Streamable HTTP`
5. กรอก `MCP Server URL` เช่น `http://localhost:8000/mcp`
6. กด `Load Embedded Inspector`
7. รอให้ Inspector แสดงใน iframe
8. ภายใน Inspector ให้ตรวจสอบว่าเชื่อมต่อ server สำเร็จ และสามารถเรียก tools/resources/prompts ได้

ผลลัพธ์ที่คาดหวัง:

- iframe แสดง UI ของ Inspector
- Inspector สามารถ list tools ได้
- เรียก tool test ได้โดยไม่เกิด connection error

### กรณีที่ 2: ทดสอบ SSE

ใช้เมื่อ MCP Server เปิด endpoint แบบ event stream

ขั้นตอน:

1. รัน Inspector ด้วยคำสั่งเดิม
2. ในหน้าจอ `MCP Agents Testing` เลือก `Transport = SSE`
3. กรอก `MCP Server URL` เช่น `http://localhost:8000/sse`
4. กด `Load Embedded Inspector`
5. ภายใน Inspector ทดสอบอ่าน resources หรือเรียก prompts/tools

ผลลัพธ์ที่คาดหวัง:

- Inspector เชื่อมต่อ endpoint SSE ได้
- เมื่อเรียกใช้งาน จะมี event หรือผลตอบกลับแสดงใน UI

### กรณีที่ 3: ทดสอบ Stdio

ใช้เมื่อ MCP Server เป็นโปรแกรมที่รันผ่าน command line

ตัวอย่างการตั้งค่า:

- `Transport = Stdio`
- `Server Command = npx`
- `Server Args = @modelcontextprotocol/server-everything`

ขั้นตอน:

1. เปิด Inspector ด้วยคำสั่ง `pnpm mcp:inspector`
2. เปิดหน้า `MCP Agents Testing`
3. เลือก `Transport = Stdio`
4. กรอก `Server Command`
5. กรอก `Server Args`
6. กด `Load Embedded Inspector`
7. ภายใน Inspector ตรวจสอบว่า process ถูกเรียกและ list capabilities ได้

ผลลัพธ์ที่คาดหวัง:

- Inspector spawn process สำเร็จ
- เห็น tools/resources/prompts ของ server
- ไม่มี error เรื่อง command not found

## 7. ชุดทดสอบแนะนำสำหรับ UAT

### Test Case 1: คัดลอก URL ได้ถูกต้อง

ขั้นตอน:

1. กรอกค่าฟิลด์ให้ครบ
2. กด `Copy URL`
3. นำไป paste ใน text editor

ผลลัพธ์ที่คาดหวัง:

- URL ต้องมี query parameters ตรงกับค่าที่กรอก

### Test Case 2: เปิด Inspector ในแท็บใหม่

ขั้นตอน:

1. กรอกค่าฟิลด์
2. กด `Open Inspector`

ผลลัพธ์ที่คาดหวัง:

- เปิดแท็บใหม่ได้
- Inspector โหลดสำเร็จ

### Test Case 3: โหลด Inspector แบบฝังในหน้า

ขั้นตอน:

1. กรอกค่าฟิลด์ให้ครบ
2. กด `Load Embedded Inspector`

ผลลัพธ์ที่คาดหวัง:

- iframe แสดง Inspector
- ไม่มีข้อความ placeholder เดิม

### Test Case 4: ตรวจสอบ validation ของ MCP Server URL

ขั้นตอน:

1. เลือก `Transport = Streamable HTTP`
2. เว้นฟิลด์ `MCP Server URL` ว่าง
3. กด `Load Embedded Inspector`

ผลลัพธ์ที่คาดหวัง:

- ระบบแจ้งเตือนว่า `Enter an MCP server URL first`

### Test Case 5: ตรวจสอบ validation ของ Server Command

ขั้นตอน:

1. เลือก `Transport = Stdio`
2. ลบค่า `Server Command` ให้เป็นค่าว่าง
3. กด `Load Embedded Inspector`

ผลลัพธ์ที่คาดหวัง:

- ระบบแจ้งเตือนว่า `Enter a server command first`

### Test Case 6: ตรวจสอบการจำค่าด้วย local storage

ขั้นตอน:

1. กรอกค่าฟิลด์ทุกตัว
2. refresh หน้าเว็บ

ผลลัพธ์ที่คาดหวัง:

- ค่าที่เคยกรอกยังอยู่

## 8. ตารางสรุปฟิลด์และการใช้งาน

| ฟิลด์/ปุ่ม | ใช้ทำอะไร | ต้องกรอกหรือไม่ | ตัวอย่างค่า |
| --- | --- | --- | --- |
| Inspector UI URL | ระบุที่อยู่ของ MCP Inspector UI | ต้องกรอก | `http://localhost:6274` |
| Proxy Session Token | token สำหรับ auth กับ MCP Inspector proxy | กรอกเมื่อมี auth | `abc123...` |
| Transport | เลือกรูปแบบการเชื่อมต่อ | ต้องเลือก | `streamable-http` |
| MCP Server URL | URL ของ MCP Server แบบ network | ต้องกรอกเมื่อใช้ HTTP/SSE | `http://localhost:8000/mcp` |
| Server Command | คำสั่งสำหรับรัน MCP Server | ต้องกรอกเมื่อใช้ stdio | `npx` |
| Server Args | arguments ของคำสั่ง | ควรกรอกเมื่อใช้ stdio | `@modelcontextprotocol/server-everything` |
| Copy URL | คัดลอก URL ของ Inspector ที่ประกอบแล้ว | ไม่ต้องกรอก | - |
| Open Inspector | เปิด Inspector ในแท็บใหม่ | ไม่ต้องกรอก | - |
| Load Embedded Inspector | โหลด Inspector ใน iframe | ไม่ต้องกรอก | - |
| Refresh Embed | โหลด iframe ใหม่ | ไม่ต้องกรอก | - |
| Copy (Launch Command) | คัดลอกคำสั่งไปรันใน terminal | ไม่ต้องกรอก | - |

## 9. ปัญหาที่พบบ่อยและแนวทางแก้

### ปัญหา: เปิด Inspector ไม่ขึ้น

ตรวจสอบ:

- MCP Inspector รันอยู่หรือไม่
- `Inspector UI URL` ถูกต้องหรือไม่
- port `6274` เปิดใช้งานหรือไม่

### ปัญหา: iframe ไม่แสดงผล

สาเหตุที่เป็นไปได้:

- Inspector หรือ reverse proxy บล็อกการ embed
- มี header ป้องกัน frame เช่น CSP หรือ `X-Frame-Options`

แนวทางแก้:

- ใช้ปุ่ม `Open Inspector` แทน

### ปัญหา: เชื่อมต่อ MCP Server ไม่ได้

ตรวจสอบ:

- URL ของ MCP Server ถูกต้องหรือไม่
- transport ที่เลือกตรงกับ server จริงหรือไม่
- server เปิดอยู่จริงหรือไม่

### ปัญหา: stdio เรียก process ไม่สำเร็จ

ตรวจสอบ:

- คำสั่งใน `Server Command` มีอยู่จริงหรือไม่
- package หรือไฟล์ใน `Server Args` รันได้จริงหรือไม่
- ลองรันคำสั่งเดียวกันใน terminal ก่อน

## 10. แนวทางใช้งานอย่างปลอดภัย

แนะนำให้ปฏิบัติดังนี้:

1. ใช้ `pnpm mcp:inspector` สำหรับงาน local ก่อนเสมอ
2. ถ้าจำเป็นต้องเปิดจาก network ให้ใช้ token ทุกครั้ง
3. อย่าเปิด `HOST=0.0.0.0` สู่ public internet โดยตรง
4. ใช้ reverse proxy และจำกัด IP ถ้าต้องเปิดให้ทีมภายนอกใช้
5. ตรวจสอบว่าคำสั่งในโหมด stdio ไม่สามารถถูกแก้ไขโดยผู้ใช้ที่ไม่เกี่ยวข้อง

## 11. สรุปการใช้งานแบบสั้น

ถ้าต้องการทดสอบเร็วที่สุด:

1. รัน `pnpm mcp:inspector`
2. เปิดหน้า `/testing/mcp-agents`
3. ตั้ง `Inspector UI URL = http://localhost:6274`
4. เลือก transport ให้ตรงกับ MCP Server
5. กรอกค่า URL หรือ command ให้ครบ
6. กด `Load Embedded Inspector` หรือ `Open Inspector`
7. ทดสอบ tool/resource/prompt ภายใน MCP Inspector

หากต้องการขยายคู่มือนี้ให้ครอบคลุมหน้าจออื่นของ AXON Admin เพิ่มเติม เช่น `Pipeline Tester`, `Pydantic AI Agent Tester`, หรือ `My Profile` สามารถต่อยอดจากรูปแบบเอกสารนี้ได้ทันที
