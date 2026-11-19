<template>
  <main class="blog-main">
    <div>
      <section class="filters">
        <div v-for="f in FILTERS" :key="f.key" class="filter-row">
          <div class="filter-head">
            <span class="filter-label">{{ f.label }}</span>
            <button
              v-if="selected[f.key].size"
              class="link"
              type="button"
              @click="clearField(f.key)"
            >
              清除
            </button>
          </div>

          <div class="filter-options">
            <button
              v-for="opt in options[f.key]"
              :key="opt"
              type="button"
              class="chip"
              :class="{ active: isSelected(f.key, opt) }"
              :aria-pressed="isSelected(f.key, opt)"
              @click="toggle(f.key, opt)"
            >
              {{ opt }}
            </button>
          </div>
        </div>

        <div class="filter-footer">
          <span>
            共 {{ filteredWorks.length }} / {{ validWorks.length }} 部
          </span>
          <button
            v-if="hasFilters"
            class="link"
            type="button"
            @click="clearAll"
          >
            重置全部
          </button>
        </div>
      </section>
    </div>
    <div class="portfolio-container">
      <div class="portfolio-unit" v-for="item in filteredWorks" :key="item.slug">
        <div class="portfolio-pic">
          <img :src="resolveSrc('pic/'+item.cover_image)">
        </div>
        <div class="portfolio-details">
          <div class="name1"><a :href="item.douban_link" target="_blank">{{item.work_name}}<i class="fa fa-external-link"></i></a></div>
          <div>职能: {{item.role_of_work}}</div>
          <div>形式: {{item.type_of_work}}</div>
          <div>类型: {{item.genre}}</div>
          <div>主演: {{item.main_actor}}</div>
          <div>系列: {{item.series}}</div>
          <div>播出: {{item.air_date}}</div>
          <div>片长: {{item.length}}</div>
          <div>简介: {{item.intro}}</div>
        </div>
      </div>
      <p v-if="!filteredWorks.length" class="empty">
        没有符合条件的作品
      </p>
    </div>
  </main>
</template>

<script setup>
import { joinURL } from 'ufo'
const config = useRuntimeConfig()
const baseURL = config.app.baseURL;

const isExternal = (url) => /^(https?:)?\/\//i.test(url)
const resolveSrc = (url) =>
  isExternal(url) ? url : joinURL(baseURL, url)

const {data: works}  = await useAsyncData('works_all', () => {
  return queryCollection('works').order("air_date",'DESC').all()
})
const validWorks = computed(() =>
  works.value?.filter(w => w.id && w.work_name && w.id !== "works/works.csv") ?? []
)
// ---------------- 筛选项配置 ----------------
const FILTERS = [
  { key: 'role_of_work', label: '职能' },
  { key: 'type_of_work', label: '形式' },
  { key: 'genre',        label: '类型' },
  { key: 'main_actor',   label: '主演' },
  { key: 'series',       label: '系列' },
]
// 单元格内多值分隔符。想兼容顿号/逗号可改成 /[/、,，]/
const SEP = '/';
function splitValues(v) {
  if (typeof v !== 'string' || !v) return []
  return v.split(SEP).map((s) => s.trim()).filter(Boolean)
}
// ---------------- 所有可选值 ----------------
const options = computed(() => {
  const out = {}
  for (const { key } of FILTERS) {
    const set = new Set()
    for (const w of validWorks.value) {
      for (const v of splitValues(w[key])) set.add(v)
    }
    // 中文按拼音排序，看着更顺
    out[key] = [...set].sort((a, b) => a.localeCompare(b, 'zh-CN'))
  }
  return out
})
// ---------------- 选中状态 ----------------
// Vue 3 的 reactive 能追踪 Set 的 has / size / 增删
const selected = reactive({
  role_of_work: new Set(),
  type_of_work: new Set(),
  genre: new Set(),
  main_actor: new Set(),
  series: new Set(),
})
function toggle(key, value) {
  const s = selected[key]
  s.has(value) ? s.delete(value) : s.add(value)
}
function isSelected(key, value) {
  return selected[key].has(value)
}
function clearField(key) {
  selected[key].clear()
}
function clearAll() {
  for (const { key } of FILTERS) selected[key].clear()
}
const hasFilters = computed(() =>
  FILTERS.some((f) => selected[f.key].size > 0),
)
// ---------------- 筛选结果 ----------------
// 规则：同一个字段内多选 = OR；不同字段之间 = AND
const filteredWorks = computed(() => {
  const list = validWorks.value
  const active = FILTERS.filter((f) => selected[f.key].size > 0)
  if (!active.length) return list

  return list.filter((w) =>
    active.every((f) =>
      splitValues(w[f.key]).some((v) => selected[f.key].has(v)),
    ),
  )
})



const { data: settings } = await useAsyncData('settings', () => {
  return queryCollection('settings').first()
})
const site_name = settings.value.site_name;
const site_description = settings.value.site_description;

definePageMeta( {
  layout: "page",
});

useSeoMeta({
  title: () => site_name,
  description: () => site_description,
})
</script>

<style type="text/css">
.portfolio-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;;
}
.portfolio-unit {
  padding: 16px;
  width: 30%;
  margin: 0px 10px 20px 10px;
  border-radius: 10px;
  border: 1px solid #dddddd; 
}
.portfolio-unit:hover {
  border-color: black;
}
.portfolio-pic {
  width: 100px;
  margin: 0px auto;
  height: 139px;
  text-align: center;
  border: 1px solid silver;
  overflow: hidden;
}
.portfolio-pic img {
  width: 100px;
}
.portfolio-details .name1{
  margin: 8px auto;
  text-align:center;
  font-weight:bold;
}
/*filter*/
.filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0px 10px 24px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fafafa;
}
.filter-row { display: flex; flex-direction: column; gap: 8px; }
.filter-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.filter-label {
  font-weight: 600;
  font-size: 14px;
  color: #374151;
}
.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  padding: 4px 12px;
  font-size: 13px;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  background: #fff;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
}
.chip:hover { border-color: #6366f1; color: #6366f1; }
.chip.active {
  background: #6366f1;
  border-color: #6366f1;
  color: #fff;
}
.filter-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #6b7280;
  border-top: 1px dashed #e5e7eb;
  padding-top: 10px;
}
.link {
  background: none;
  border: none;
  color: #6366f1;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}
.link:hover { text-decoration: underline; }
.works { list-style: none; padding: 0; margin: 0; }
.work-item {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}
.meta { color: #9ca3af; font-size: 13px; }
.empty { color: #9ca3af; text-align: center; padding: 24px 0; }

@media all and (max-width: 425px) {
  .portfolio-unit {
    width: 45%;
  }
}
@media all and (max-width: 375px) {
  .portfolio-unit {
    margin: 0 0 20px 10px;
  }
}
</style>