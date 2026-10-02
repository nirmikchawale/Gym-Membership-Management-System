import { chromium } from 'playwright'
import fs from 'node:fs/promises'

const baseURL = process.env.GRIDSTONE_UI_BASE_URL ?? 'http://127.0.0.1:8000'
const email = process.env.GRIDSTONE_UI_EMAIL ?? 'ui-evidence@gridstone.local'
const password = process.env.GRIDSTONE_UI_PASSWORD

if (!password) throw new Error('GRIDSTONE_UI_PASSWORD is required')

const outDir = process.env.GRIDSTONE_UI_OUTPUT_DIR ?? '/workspace/ui-evidence'
await fs.mkdir(outDir, { recursive: true })

const suffix = Date.now().toString().slice(-7)
const memberCode = `UIEVID-M-${suffix}`
const planCode = `UIEVID-P-${suffix}`

async function screenshot(page, name) {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true })
}

async function login(page) {
  await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' })
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Enter Gridstone' }).click()
  await page.getByRole('heading', { name: 'Today at Gridstone.' }).waitFor()
}

const browser = await chromium.launch({ headless: true })

try {
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'dark',
  })
  const page = await desktop.newPage()
  await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' })
  await screenshot(page, '01-login-desktop-dark-input')
  await login(page)
  await screenshot(page, '02-dashboard-desktop-dark-output')

  await page.goto(`${baseURL}/members`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Add member' }).click()
  await screenshot(page, '03-member-create-desktop-input')
  await page.getByLabel(/Member code/).fill(memberCode)
  await page.getByLabel('First name').fill('UI Evidence')
  await page.getByLabel('Last name').fill('Member')
  await page.getByLabel('Email').fill(`ui-evidence-${suffix}@example.invalid`)
  await page.getByRole('button', { name: 'Add member' }).click()
  await page.getByText(memberCode, { exact: true }).first().waitFor()
  await screenshot(page, '04-member-directory-desktop-output')

  await page.goto(`${baseURL}/plans`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Create plan' }).click()
  await screenshot(page, '05-plan-create-desktop-input')
  await page.getByLabel('Plan code').fill(planCode)
  await page.getByLabel('Plan name').fill('UI Evidence Plan')
  await page.getByLabel('Description').fill('Synthetic Phase 4H visual acceptance plan')
  await page.getByLabel('Duration in days').fill('30')
  await page.getByLabel('Price').fill('1499')
  await page.getByRole('button', { name: 'Create plan' }).click()
  await page.getByText(planCode, { exact: true }).first().waitFor()
  await screenshot(page, '06-plan-catalog-desktop-output')

  await page.goto(`${baseURL}/memberships`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Assign membership' }).click()
  await page.getByLabel('Member').selectOption({ label: `${memberCode} — UI Evidence Member` })
  await page.getByLabel('Plan').selectOption({ label: `${planCode} — UI Evidence Plan` })
  await page.getByLabel(/Notes/).fill('Phase 4H visual acceptance membership')
  await screenshot(page, '07-membership-assign-desktop-input')
  await page.getByRole('button', { name: 'Assign membership' }).click()
  await page.getByText(memberCode, { exact: true }).first().waitFor()
  await screenshot(page, '08-membership-ledger-desktop-output')

  await page.goto(`${baseURL}/attendance`, { waitUntil: 'networkidle' })
  await screenshot(page, '09-attendance-desktop-input-output')

  await page.goto(`${baseURL}/reports`, { waitUntil: 'networkidle' })
  await screenshot(page, '10-reports-desktop-output')
  await desktop.close()

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: 'light',
  })
  const phone = await mobile.newPage()
  await phone.goto(`${baseURL}/`, { waitUntil: 'networkidle' })
  await screenshot(phone, '11-login-mobile-light-input')
  await login(phone)
  await screenshot(phone, '12-dashboard-mobile-light-output')

  await phone.goto(`${baseURL}/members`, { waitUntil: 'networkidle' })
  await screenshot(phone, '13-members-mobile-light-output')

  await phone.goto(`${baseURL}/memberships`, { waitUntil: 'networkidle' })
  await screenshot(phone, '14-memberships-mobile-light-output')

  await phone.goto(`${baseURL}/attendance`, { waitUntil: 'networkidle' })
  await screenshot(phone, '15-attendance-mobile-light-output')

  await phone.goto(`${baseURL}/reports`, { waitUntil: 'networkidle' })
  await screenshot(phone, '16-reports-mobile-light-output')
  await mobile.close()

  console.log(`UI_EVIDENCE_COMPLETE member_code=${memberCode} plan_code=${planCode}`)
} finally {
  await browser.close()
}
