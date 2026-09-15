import { describe, expect, it } from "vitest";
import {
  daysSinceInVietnam,
  isTodayInVietnam,
  formatDateVN,
  vietnamDayRangeUtc,
  vietnamDateKey,
  lastNDaysInVietnam,
} from "@/lib/datetime/vn";

describe("Vietnam timezone conversion (UTC storage -> UTC+7 display)", () => {
  it("một mốc thời gian UTC muộn trong ngày vẫn thuộc 'hôm nay' theo giờ VN dù lệch ngày UTC", () => {
    // now = 2026-01-02T01:00:00Z = 2026-01-02T08:00 VN
    // log  = 2026-01-01T18:00:00Z = 2026-01-02T01:00 VN -> cùng ngày VN, khác ngày UTC
    const now = new Date("2026-01-02T01:00:00Z");
    const loggedAt = "2026-01-01T18:00:00Z";
    expect(isTodayInVietnam(loggedAt, now)).toBe(true);
  });

  it("một mốc thời gian UTC sáng sớm lại thuộc 'ngày hôm qua' theo giờ VN", () => {
    // now = 2026-01-02T01:00:00Z = 2026-01-02T08:00 VN
    // log  = 2026-01-01T16:00:00Z = 2026-01-01T23:00 VN -> ngày VN trước đó
    const now = new Date("2026-01-02T01:00:00Z");
    const loggedAt = "2026-01-01T16:00:00Z";
    expect(isTodayInVietnam(loggedAt, now)).toBe(false);
    expect(daysSinceInVietnam(loggedAt, now)).toBe(1);
  });

  it("tính đúng số ngày chưa log khi cách nhau đúng 2 ngày theo lịch VN", () => {
    const now = new Date("2026-01-10T10:00:00Z"); // 2026-01-10T17:00 VN
    const loggedAt = "2026-01-08T10:00:00Z"; // 2026-01-08T17:00 VN
    expect(daysSinceInVietnam(loggedAt, now)).toBe(2);
  });

  it("format hiển thị dd/MM/yyyy theo giờ Việt Nam, không theo giờ UTC", () => {
    // 2026-03-04T18:00:00Z = 2026-03-05T01:00 VN -> phải hiển thị 05/03/2026, không phải 04/03/2026
    expect(formatDateVN("2026-03-04T18:00:00Z")).toBe("05/03/2026");
  });

  it("vietnamDayRangeUtc quy đổi đúng biên UTC của 1 ngày lịch VN (UTC+7)", () => {
    // 2026-05-10 00:00 VN = 2026-05-09T17:00:00Z
    const { startUtc, endUtc } = vietnamDayRangeUtc("2026-05-10");
    expect(startUtc.toISOString()).toBe("2026-05-09T17:00:00.000Z");
    // 2026-05-10 23:59:59.999 VN = 2026-05-10T16:59:59.999Z
    expect(endUtc.toISOString()).toBe("2026-05-10T16:59:59.999Z");
  });

  it("vietnamDateKey gộp đúng ngày lịch VN cho biểu đồ 30 ngày", () => {
    expect(vietnamDateKey("2026-05-09T17:00:00.000Z")).toBe("2026-05-10");
    expect(vietnamDateKey("2026-05-09T16:59:59.999Z")).toBe("2026-05-09");
  });

  it("lastNDaysInVietnam trả về đúng 30 ngày liên tiếp, kết thúc ở hôm nay", () => {
    const now = new Date("2026-05-10T10:00:00Z"); // 2026-05-10 VN
    const dates = lastNDaysInVietnam(30, now);
    expect(dates).toHaveLength(30);
    expect(dates[29]).toBe("2026-05-10");
    expect(dates[0]).toBe("2026-04-11");
  });
});
