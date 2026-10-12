"use client";
import WorkspaceSelect from "@/components/ui/WorkspaceSelect";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  readFrontend,
  saveEntity,
  deleteEntity,
  changeFrontend,
  resetFrontend,
  importFrontend,
  issueLocalCertificate,
  type LocalEntity,
} from "@/lib/frontendStore";
import { useAdmin } from "./AdminProvider";
import styles from "./AdminShowcase.module.css";

export default function LocalAdminManager() {
  useAdmin(); // Refresh the editor whenever shared local data changes.
  const path = usePathname(),
    state = readFrontend();
  const collection =
    path.includes("question-bank") || path.includes("exams")
      ? "questions"
      : path.includes("course") && !path.includes("reports")
        ? "courses"
        : path.includes("diplomas")
          ? "programs"
          : path.includes("instructors")
            ? "instructors"
            : path.includes("supervisors")
              ? "users"
              : path.includes("students")
                ? "users"
                : null;
  const [editing, setEditing] = useState<Partial<LocalEntity> | null>(null),
    [message, setMessage] = useState(""),
    [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const isSettings =
    path.includes("profile-management") || path.includes("database-backups");
  const labels = {
    programs: "البرامج",
    courses: "المقررات",
    instructors: "المحاضرين",
    users: "المستخدمين",
    questions: "أسئلة الاختبارات",
  };
  const items = collection
    ? state[collection].filter(
        (item) =>
          collection !== "users" ||
          item.role === (path.includes("supervisors") ? "admin" : "student"),
      )
    : [];
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(readFrontend(), null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "mansatak-data.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (!collection && !isSettings && !path.includes("certificates")) return null;
  return (
    <section className={styles.panel} data-local-admin-tools>
      <div className={styles.panelHead}>
        <div>
          <h2>
            {isSettings
              ? "إعدادات التجربة المحلية"
              : path.includes("certificates")
                ? "إصدار الشهادات"
                : `إدارة ${labels[collection!]}`}
          </h2>
          <p>تغييراتك محفوظة في هذا المتصفح وتظهر في الموقع ولوحة الطلاب.</p>
        </div>
        <button
          className={styles.primary}
          type="button"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "إغلاق الأدوات" : "فتح أدوات الإدارة"}
        </button>
      </div>
      {message && <p role="status">{message}</p>}
      {expanded && (
        <>
          {collection && (
            <>
              <button
                className={styles.primary}
                type="button"
                onClick={() => {
                  setEditing({
                    name: "",
                    title: "",
                    description: "",
                    slug: "",
                    price: 0,
                    is_published: true,
                    category_id: state.programs[0]?.id,
                    section_id: state.sections[0]?.id,
                    role: path.includes("supervisors") ? "admin" : "student",
                    status: "active",
                    options: ["", "", "", ""],
                    answer: 0,
                  });
                  setMessage("");
                }}
              >
                إضافة جديد
              </button>
              <div className={styles.localRecordList}>
                {items.map((item) => (
                  <article key={item.id}>
                    <strong>
                      {collection === "questions"
                        ? item.question
                        : collection === "courses"
                          ? item.title
                          : item.name}
                    </strong>
                    <div>
                      <button
                        type="button"
                        onClick={() => setEditing(structuredClone(item))}
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(item.id)}
                      >
                        حذف
                      </button>
                    </div>
                    {pendingDelete === item.id && (
                      <div role="alert">
                        <span>هل تريد حذف هذا السجل؟</span>
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              deleteEntity(collection, item.id);
                              setPendingDelete(null);
                              setMessage("تم الحذف");
                            } catch (error) {
                              setMessage(
                                error instanceof Error
                                  ? error.message
                                  : "تعذر حفظ التغيير",
                              );
                            }
                          }}
                        >
                          تأكيد الحذف
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(null)}
                        >
                          إلغاء
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
              {editing && (
                <form
                  className={styles.localEditor}
                  onSubmit={(e) => {
                    e.preventDefault();
                    try {
                      const value = { ...editing };
                      if (collection === "programs") {
                        value.slug = value.slug || `program-${Date.now()}`;
                        value.courses_count = value.courses_count ?? 0;
                      }
                      if (collection === "courses") {
                        value.lessons_count = (value.chapters ?? []).reduce(
                          (sum: number, ch: LocalEntity) =>
                            sum + (ch.lessons?.length ?? 0),
                          0,
                        );
                        value.students_count = 0;
                        value.duration = value.duration ?? 4;
                        value.is_free = Number(value.price) === 0;
                        value.cover_image = value.cover_image || "/banner.jpg";
                        value.instructor_id =
                          value.instructor_id ?? state.instructors[0]?.id;
                      }
                      saveEntity(collection, value);
                      setEditing(null);
                      setMessage("تم حفظ التغييرات");
                    } catch (error) {
                      setMessage(
                        error instanceof Error
                          ? error.message
                          : "تعذر حفظ التغييرات",
                      );
                    }
                  }}
                >
                  <h3>{editing.id ? "تعديل السجل" : "سجل جديد"}</h3>
                  {collection === "questions" ? (
                    <>
                      <label>
                        السؤال
                        <input
                          required
                          value={editing.question ?? ""}
                          onChange={(e) =>
                            setEditing({ ...editing, question: e.target.value })
                          }
                        />
                      </label>
                      {(editing.options ?? ["", "", "", ""]).map(
                        (option: string, i: number) => (
                          <label key={i}>
                            الخيار {i + 1}
                            <input
                              required
                              value={option}
                              onChange={(e) => {
                                const options = [...(editing.options ?? [])];
                                options[i] = e.target.value;
                                setEditing({ ...editing, options });
                              }}
                            />
                          </label>
                        ),
                      )}
                      <label>
                        الإجابة الصحيحة
                        <WorkspaceSelect
                          value={editing.answer ?? 0}
                          onValueChange={(value) =>
                            setEditing({
                              ...editing,
                              answer: Number(value),
                            })
                          }
                        >
                          {[0, 1, 2, 3].map((i) => (
                            <option key={i} value={i}>
                              الخيار {i + 1}
                            </option>
                          ))}
                        </WorkspaceSelect>
                      </label>
                    </>
                  ) : (
                    <>
                      <label>
                        الاسم
                        <input
                          required
                          value={
                            collection === "courses"
                              ? editing.title
                              : editing.name
                          }
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              [collection === "courses" ? "title" : "name"]:
                                e.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        الوصف
                        <textarea
                          rows={3}
                          value={editing.description ?? editing.bio ?? ""}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              [collection === "instructors"
                                ? "bio"
                                : "description"]: e.target.value,
                            })
                          }
                        />
                      </label>
                    </>
                  )}
                  {(collection === "programs" || collection === "courses") && (
                    <>
                      <label>
                        السعر
                        <input
                          type="number"
                          min="0"
                          value={editing.price ?? 0}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              price: Number(e.target.value),
                            })
                          }
                        />
                      </label>
                      <label>
                        حالة النشر
                        <WorkspaceSelect
                          value={String(editing.is_published !== false)}
                          onValueChange={(value) =>
                            setEditing({
                              ...editing,
                              is_published: value === "true",
                            })
                          }
                        >
                          <option value="true">منشور</option>
                          <option value="false">مسودة</option>
                        </WorkspaceSelect>
                      </label>
                    </>
                  )}
                  {(collection === "programs" || collection === "courses") && (
                    <label>
                      القسم
                      <WorkspaceSelect
                        value={editing.section_id ?? state.sections[0]?.id}
                        onValueChange={(value) =>
                          setEditing({
                            ...editing,
                            section_id: Number(value),
                          })
                        }
                      >
                        {state.sections.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </WorkspaceSelect>
                    </label>
                  )}
                  {collection === "courses" && (
                    <label>
                      المحاضر
                      <WorkspaceSelect
                        value={
                          editing.instructor_id ?? state.instructors[0]?.id
                        }
                        onValueChange={(value) =>
                          setEditing({
                            ...editing,
                            instructor_id: Number(value),
                          })
                        }
                      >
                        {state.instructors.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name}
                          </option>
                        ))}
                      </WorkspaceSelect>
                    </label>
                  )}
                  {collection === "questions" && (
                    <label>
                      المقرر
                      <WorkspaceSelect
                        value={editing.course_id ?? ""}
                        onValueChange={(value) =>
                          setEditing({
                            ...editing,
                            course_id: value ? Number(value) : null,
                          })
                        }
                      >
                        <option value="">كل المقررات</option>
                        {state.courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </WorkspaceSelect>
                    </label>
                  )}
                  {collection === "programs" && (
                    <label>
                      الرابط المختصر
                      <input
                        value={editing.slug ?? ""}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            slug: e.target.value.replace(/\s+/g, "-"),
                          })
                        }
                      />
                    </label>
                  )}
                  {collection === "courses" && (
                    <>
                      <label>
                        البرنامج
                        <WorkspaceSelect
                          value={editing.category_id ?? ""}
                          onValueChange={(value) =>
                            setEditing({
                              ...editing,
                              category_id: Number(value),
                            })
                          }
                        >
                          {state.programs.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </WorkspaceSelect>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            chapters: [
                              ...(editing.chapters ?? []),
                              {
                                id: Date.now(),
                                title: "فصل جديد",
                                lessons: [],
                              },
                            ],
                          })
                        }
                      >
                        إضافة فصل
                      </button>
                      {(editing.chapters ?? []).map((ch, index) => (
                        <fieldset key={ch.id}>
                          <legend>الفصل {index + 1}</legend>
                          <input
                            aria-label="عنوان الفصل"
                            required
                            value={ch.title}
                            onChange={(e) => {
                              const chapters = structuredClone(
                                editing.chapters ?? [],
                              );
                              chapters[index].title = e.target.value;
                              setEditing({ ...editing, chapters });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const chapters = structuredClone(
                                editing.chapters ?? [],
                              );
                              chapters[index].lessons.push({
                                id: Date.now(),
                                title: "درس جديد",
                                content: "",
                                duration_seconds: 600,
                              });
                              setEditing({ ...editing, chapters });
                            }}
                          >
                            إضافة درس
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditing({
                                ...editing,
                                chapters: (editing.chapters ?? []).filter(
                                  (_: unknown, i: number) => i !== index,
                                ),
                              })
                            }
                          >
                            حذف الفصل
                          </button>
                          {ch.lessons.map((lesson, j) => (
                            <div key={lesson.id}>
                              <input
                                aria-label="عنوان الدرس"
                                required
                                value={lesson.title}
                                onChange={(e) => {
                                  const chapters = structuredClone(
                                    editing.chapters ?? [],
                                  );
                                  chapters[index].lessons[j].title =
                                    e.target.value;
                                  setEditing({ ...editing, chapters });
                                }}
                              />
                              <textarea
                                aria-label="محتوى الدرس"
                                rows={3}
                                value={lesson.content ?? ""}
                                onChange={(e) => {
                                  const chapters = structuredClone(
                                    editing.chapters ?? [],
                                  );
                                  chapters[index].lessons[j].content =
                                    e.target.value;
                                  setEditing({ ...editing, chapters });
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const chapters = structuredClone(
                                    editing.chapters ?? [],
                                  );
                                  chapters[index].lessons.splice(j, 1);
                                  setEditing({ ...editing, chapters });
                                }}
                              >
                                حذف الدرس
                              </button>
                            </div>
                          ))}
                        </fieldset>
                      ))}
                    </>
                  )}
                  {collection === "users" && (
                    <>
                      <label>
                        البريد الإلكتروني
                        <input
                          type="email"
                          required
                          value={editing.email ?? ""}
                          onChange={(e) =>
                            setEditing({ ...editing, email: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        حالة الحساب
                        <WorkspaceSelect
                          value={editing.status ?? "active"}
                          onValueChange={(value) =>
                            setEditing({ ...editing, status: value })
                          }
                        >
                          <option value="active">نشط</option>
                          <option value="blocked">محظور</option>
                        </WorkspaceSelect>
                      </label>
                    </>
                  )}
                  {collection === "instructors" && (
                    <label>
                      التخصص
                      <input
                        required
                        value={editing.title ?? ""}
                        onChange={(e) =>
                          setEditing({ ...editing, title: e.target.value })
                        }
                      />
                    </label>
                  )}
                  <div>
                    <button className={styles.primary} type="submit">
                      حفظ التغييرات
                    </button>
                    <button type="button" onClick={() => setEditing(null)}>
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
          {path.includes("certificates") && (
            <form
              className={styles.localEditor}
              onSubmit={(e) => {
                e.preventDefault();
                const input = new FormData(e.currentTarget);
                issueLocalCertificate(Number(input.get("course")));
                setMessage("تم إصدار الشهادة ويمكن التحقق منها من صفحة الطلاب");
              }}
            >
              <label>
                المقرر
                <WorkspaceSelect name="course">
                  {state.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </WorkspaceSelect>
              </label>
              <button type="submit" className={styles.primary}>
                إصدار شهادة للطالب
              </button>
            </form>
          )}
          {isSettings && (
            <div className={styles.localEditor}>
              <button type="button" onClick={download}>
                تصدير البيانات JSON
              </button>
              <label>
                استيراد نسخة البيانات
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      importFrontend(JSON.parse(await file.text()));
                      setMessage("تم استيراد البيانات");
                    } catch (error) {
                      setMessage(
                        error instanceof Error
                          ? error.message
                          : "تعذر استيراد البيانات",
                      );
                    }
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      "سيتم حذف تغييرات التجربة والعودة للبيانات الأصلية. هل تريد المتابعة؟",
                    )
                  ) {
                    resetFrontend();
                    setMessage("تمت إعادة البيانات الأصلية");
                  }
                }}
              >
                إعادة ضبط التجربة
              </button>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  changeFrontend((s) => {
                    s.users.find((u) => u.id === 99002)!.name = String(
                      data.get("name"),
                    );
                  });
                  setMessage("تم تحديث اسم الإدارة");
                }}
              >
                <label>
                  اسم الإدارة
                  <input
                    name="name"
                    defaultValue={state.users.find((u) => u.id === 99002)?.name}
                    required
                  />
                </label>
                <button type="submit" className={styles.primary}>
                  حفظ
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </section>
  );
}
