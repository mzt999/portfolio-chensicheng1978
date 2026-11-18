<template>
  <aside>
    <div class="aside-unit">
      <p><i class="fa fa-user"></i>&nbsp;人物介绍</p>
      <hr>
      <p>
        <span class="profile-pic">
          <img :src="profile_pic">
        </span>&nbsp;&nbsp;&nbsp;&nbsp;
        <span class="profile-name">{{author_name}}</span>
        </p>
      <p>{{intro}}</p>
      <p>
        <a v-for="(item, i) in SNS" :key="i" :href="item.href" 
        target="_blank" class="no-decor-link sns"
        ><i class="fa-brands" :class="item.fa_class"></i>{{item.name}}</a>
      </p>
    </div>
    <div class="aside-unit">
      <p><i class="fa fa-external-link"></i>&nbsp;友情链接</p>
      <hr>
      <p v-for="(link, index) in friendSites" :key="index">
        <a class="blog-link" :href="link.href" target="_blank">{{link.text}}</a>
      </p>
    </div>
  </aside>
</template>

<script setup>
const { data: settings } = await useAsyncData('settings', () => {
  return queryCollection('settings').first()
})
const author_name = settings.value.author_name;
const profile_pic = settings.value.about.profile_pic;
const intro = settings.value.about.intro;
const SNS = settings.value.about.SNS;
const friendSites = settings.value.friendSites;
</script>

<style type="text/css">
.sns {
  padding: 1px 8px 1px 2px;
  font-weight: bold;
  display: inline-block;
}
.sns:hover {
  background: #d1d1d1;
  border-radius: 10px;
}
</style>
