import { slugify } from '##/lib/util'
import { FunctionComponent } from 'preact'
import { Header } from '##/components/Header'

export type SectionProps = {
  title: string
}

export const Section: FunctionComponent<SectionProps> = ({ title, children }) => {
  const headerSlug = slugify(title)
  return (
    <section class="flex flex-col gap-y-4 my-6">
      {children}
      <hr class="mt-2" />
    </section>
  )
}
