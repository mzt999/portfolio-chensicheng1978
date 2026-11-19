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
      <div class="portfolio-unit" v-for="item in filteredWorks" :key="item.slug" 
      :aria-label="`查看 ${item.work_name}`"
      @click="openLightbox(item)"
      >
        <div class="portfolio-pic">
          <img
            :ref="(el) => setThumbRef(item.id, el)"
            :src="coverUrl(item)"
            :alt="item.work_name"
            loading="lazy"
          />
        </div>
        <div class="portfolio-details">
          <div class="name1">{{item.work_name}}<br>
            <span class="air-year">({{item.air_year}})</span>
          </div>
        </div>
      </div>
      <p v-if="!filteredWorks.length" class="empty">
        没有符合条件的作品
      </p>
    </div>
  </main>
   <!-- ========== 放大预览层 ========== -->
  <Teleport to="body">
    <Transition name="lb">
      <div v-if="isOpen" class="lb" @click.self="closeLightbox">
        <button
          class="lb-nav prev"
          type="button"
          aria-label="上一个"
          :disabled="filteredWorks.length <= 1"
          @click="goPrev"
        >
          <i class="fa-solid fa-chevron-left"></i>
        </button>

        <button
          class="lb-nav next"
          type="button"
          aria-label="下一个"
          :disabled="filteredWorks.length <= 1"
          @click="goNext"
        >
          <i class="fa-solid fa-chevron-right"></i>
        </button>

        <button
          class="lb-close"
          type="button"
          aria-label="关闭"
          @click="closeLightbox"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>

        <div class="lb-content">
          <div ref="mediaRef" class="lb-media">
            <img :src="coverUrl(activeWork)" :alt="activeWork.work_name" />
          </div>

          <div class="lb-info">
            <h2>{{ activeWork.work_name }}</h2>

            <div class="lb-meta">
              <span v-if="activeWork.type_of_work">{{ activeWork.type_of_work }}</span>
              <span v-if="activeWork.genre">{{ activeWork.genre }}</span>
              <span v-if="activeWork.length">{{ activeWork.length }}</span>
            </div>

            <p v-if="activeWork.air_date" class="lb-line">
              <span class="lb-k">职能</span>{{ activeWork.role_of_work }}
            </p>
            <p v-if="activeWork.air_date" class="lb-line">
              <span class="lb-k">播出</span>{{ activeWork.air_date }}
            </p>
            <p v-if="activeWork.main_actor" class="lb-line">
              <span class="lb-k">主演</span>{{ activeWork.main_actor }}
            </p>
            <p v-if="activeWork.series" class="lb-line">
              <span class="lb-k">系列</span>{{ activeWork.series }}
            </p>
            <p v-if="activeWork.douban_link" class="lb-line">
              <span class="lb-k">豆瓣</span><a :href="activeWork.douban_link" target="_blank">前往豆瓣<i class="fa fa-external-link"></i></a>
            </p>

            <p v-if="activeWork.intro" class="lb-intro">{{ activeWork.intro }}</p>

            <p class="lb-count">{{ activeIndex + 1 }} / {{ filteredWorks.length }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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

// ==================== 图片路径 ====================
// 按你的实际静态资源目录调整；若 cover_image 已是完整 URL 或 / 开头路径会原样返回
function coverUrl(work) {
  const c = work?.cover_image
  if (!c) return ''
  if (/^(https?:)?\/\//.test(c) || c.startsWith('/')) return c
  return `pic/${c}`
}

// ==================== 放大预览 ====================
const activeId = ref(null)

const activeIndex = computed(() =>
  activeId.value == null
    ? -1
    : filteredWorks.value.findIndex((w) => w.id === activeId.value),
)
const activeWork = computed(() =>
  activeIndex.value >= 0 ? filteredWorks.value[activeIndex.value] : null,
)
const isOpen = computed(() => activeWork.value != null)

// 记录缩略图元素，用于 FLIP 起点
const thumbRefs = new Map()
function setThumbRef(id, el) {
  if (el) thumbRefs.set(id, el)
  else thumbRefs.delete(id)
}

const mediaRef = ref(null)

async function openLightbox(work) {
  const thumb = thumbRefs.get(work.id)
  const fromRect = thumb ? thumb.getBoundingClientRect() : null

  activeId.value = work.id
  await nextTick()

  const el = mediaRef.value
  if (!el || !fromRect) return

  // 目标位置（遮罩中的最终布局）
  const toRect = el.getBoundingClientRect()
  if (!toRect.width || !toRect.height) return

  const scale = fromRect.width / toRect.width
  const dx = fromRect.left - toRect.left
  const dy = fromRect.top - toRect.top

  // 先把大图“放”到缩略图的位置和大小
  el.style.transition = 'none'
  el.style.transformOrigin = 'top left'
  el.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`
  void el.offsetWidth // 强制 reflow

  // 下一帧过渡回真实位置
  el.style.transition = 'transform 0.36s cubic-bezier(0.2, 0.8, 0.2, 1)'
  el.style.transform = ''
}

function closeLightbox() {
  activeId.value = null
}

function goPrev() {
  const list = filteredWorks.value
  if (!list.length) return
  const i = activeIndex.value
  const next = (i - 1 + list.length) % list.length
  activeId.value = list[next].id
}

function goNext() {
  const list = filteredWorks.value
  if (!list.length) return
  const i = activeIndex.value
  const next = (i + 1) % list.length
  activeId.value = list[next].id
}

// 筛选变化后，如果当前项被筛掉就关闭
watch(filteredWorks, (list) => {
  if (activeId.value == null) return
  if (!list.some((w) => w.id === activeId.value)) {
    activeId.value = null
  }
})

// 键盘：Esc 关闭，← → 切换
function onKeydown(e) {
  if (!isOpen.value) return
  if (e.key === 'Escape') closeLightbox()
  else if (e.key === 'ArrowLeft') goPrev()
  else if (e.key === 'ArrowRight') goNext()
}

// 打开时锁滚动
watch(isOpen, (open) => {
  if (!import.meta.client) return
  document.documentElement.style.overflow = open ? 'hidden' : ''
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  if (import.meta.client) document.documentElement.style.overflow = ''
})

// 导入网站设定
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
  width: 30%;
  margin: 0px 10px 20px 10px;
  border-radius: 10px;
  border: 1px solid #dddddd;
  cursor: pointer;
}
.portfolio-unit:hover {
  border-color: gray;
  box-shadow: 0px 0px 10px 5px silver;
}
.portfolio-pic {
  width: 100%;
  margin: 0px auto;
  height: 264px;
  text-align: center;
  overflow: hidden;
  border-radius: 10px 10px 0px 0px;
  border-bottom: 1px solid silver;
}
.portfolio-pic img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.portfolio-details .name1{
  margin: 8px auto;
  text-align:center;
  font-weight:bold;
}
.portfolio-details .air-year {
  font-size: 12px;
  color: gray;
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

/* ========== 遮罩层 ========== */
.lb {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 80px;
}

.lb-content {
  display: flex;
  gap: 36px;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  max-width: 1100px;
  max-height: 100%;
}

.lb-media {
  flex: 0 0 auto;
  width: min(40vw, 460px);
  aspect-ratio: 2 / 3;
  border-radius: 14px;
  overflow: hidden;
  background: #111;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55);
}
.lb-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.lb-info {
  flex: 1 1 auto;
  min-width: 0;
  max-height: 80vh;
  overflow-y: auto;
  color: #f3f4f6;
  padding-right: 8px;
}
.lb-info h2 { margin: 0 0 12px; font-size: 28px; line-height: 1.3; }

.lb-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.lb-meta span {
  padding: 2px 10px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 999px;
  font-size: 12px;
  color: #d1d5db;
}

.lb-line { margin: 8px 0; color: #d1d5db; font-size: 14px; }
.lb-k {
  display: inline-block;
  min-width: 3em;
  margin-right: 8px;
  color: #9ca3af;
}

.lb-intro {
  margin-top: 18px;
  line-height: 1.75;
  color: #d1d5db;
  white-space: pre-line;
}

.lb-count { margin-top: 24px; font-size: 13px; color: #9ca3af; }

/* ========== 左右切换 & 关闭 ========== */
.lb-nav,
.lb-close {
  position: absolute;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, opacity 0.15s;
}
.lb-nav:hover,
.lb-close:hover { background: rgba(255, 255, 255, 0.26); }

.lb-nav {
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  font-size: 18px;
}
.lb-nav.prev { left: 16px; }
.lb-nav.next { right: 16px; }
.lb-nav:disabled { opacity: 0.3; cursor: default; }

.lb-close {
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  font-size: 18px;
}

/* ========== 过渡 ========== */
.lb-enter-active,
.lb-leave-active { transition: opacity 0.25s ease; }
.lb-enter-from,
.lb-leave-to { opacity: 0; }

/* 移动端简单适配 */
@media (max-width: 720px) {
  .lb { padding: 24px 16px; }
  .lb-content { flex-direction: column; align-items: flex-start; gap: 16px; overflow-y: auto; }
  .lb-media { width: min(70vw, 320px); }
  .lb-nav.prev { left: 8px; }
  .lb-nav.next { right: 8px; }
  .lb-info { max-height: none; }
}
@media all and (max-width: 425px) {
  .lb-content {
    width: 300px;
    display: block;
  }
}
@media all and (max-width: 375px) {
  .lb-content {
    width: 250px;
  }
}

/*其他部分*/
@media all and (max-width: 768px) {
  .portfolio-pic {
    height: 311px;
  }
}
@media all and (max-width: 425px) {
  .portfolio-unit {
    width: 45%;
  }
  .portfolio-pic {
    height: 252px;
  }
}
@media all and (max-width: 375px) {
  .portfolio-unit {
    margin: 0 0 20px 10px;
  }
  .portfolio-pic {
    height: 221px;
  }
}
</style>