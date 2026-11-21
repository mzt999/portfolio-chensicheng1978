import { defineContentConfig, defineCollection } from '@nuxt/content'
import { z } from 'zod' // or 'zod/v3' if your setup exposes this subpath

export default defineContentConfig({
  collections: {
    works: defineCollection({
      type: 'data',
      source: 'works.csv',
      schema: 
        z.object({
          slug: z.string(),
          work_name: z.string(),
          role_of_work: z.string(),
          type_of_work: z.string(),
          genre: z.string(),
          main_actor: z.string(),
          series: z.string(),
          air_year: z.string(),
          air_date: z.string(),
          length: z.string(),
          isDirector: z.string(),
          isScreenwriter: z.string(),
          isProducer: z.string(),
          isActor: z.string(),
          douban_link: z.string(),
          cover_image: z.string(),
          intro: z.string(),
          box_office: z.string(),
          box_office_series: z.string(),
        }),
    }),
    settings: defineCollection({
      type: 'data', // 关键：表明这是单文件数据，而非页面集合
      source: 'settings.yml', // 精确指向单个文件
      schema: z.object({
        author_name: z.string(),
        site_name: z.string(),
        site_description: z.string(),
        about: z.object({
          profile_pic: z.string(),
          intro: z.string(),
          SNS: z.array(z.object({
            name: z.string(),
            href: z.string(),
            fa_class: z.string(),
          })),
        }),
        news: z.array(z.object({
          text: z.string(),
          links: z.array(z.object({
            text: z.string(),
            href: z.string(),
            fa_class: z.string(),
          })),
        })),
        friendSites: z.array(z.object({
          href: z.string(),
          text: z.string(),
        })),
        footer: z.array(z.object({
          text: z.string(),
          link: z.object({
            text: z.string(),
            href: z.string(),
            fa_class: z.string(),
          }),
        })),
      })
    }),
  },
})
