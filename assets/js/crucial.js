let currentPage = 1;

const placeButtons = (currentPage, totalPages) => {
  const buttonHolder = document.getElementById('pageSelector')
  const pageCountContainer = document.getElementById('pageCount')
  pageCountContainer.innerHTML = ''
  buttonHolder.innerHTML = ''
  const prevButton = document.createElement('button')
  const nextButton = document.createElement('button')
  prevButton.textContent = 'prev'
  nextButton.textContent = 'next'
  prevButton.classList.add('crucialButton')
  nextButton.classList.add('crucialButton')
  prevButton.addEventListener('click', async () => {
    const container = document.getElementById('crucialContainer')
    container.classList.add('fade-out')
    await new Promise(r => setTimeout(r, 300))
      currentPage--
      const {data, totalPages} = await getTracks(currentPage)
    displayTracks(data)
    window.scrollTo({ top: 200, behavior: 'smooth' });    container.classList.remove('fade-out')
      placeButtons(currentPage, totalPages)
    })
  nextButton.addEventListener('click', async () => {
    const container = document.getElementById('crucialContainer')
    container.classList.add('fade-out')
    await new Promise(r => setTimeout(r, 300))
      currentPage++
      const {data, totalPages} = await getTracks(currentPage)
    displayTracks(data)
    window.scrollTo({ top: 200, behavior: 'smooth' });    container.classList.remove('fade-out')
      placeButtons(currentPage, totalPages)
    })
  const pageCount = document.createElement('span')
  pageCount.innerText = `page ${currentPage} of ${totalPages}`
  if (currentPage !== 1) buttonHolder.append(prevButton)
  if (currentPage !== totalPages) buttonHolder.append(nextButton)
  pageCountContainer.append(pageCount)
}

const displayTracks = (crucialData) => {
  const container = document.getElementById('crucialContainer')
  container.innerHTML = ''
  const loader = document.getElementById('loading')
  if(loader) loader.remove()
  const info = document.getElementById('crucialInfo')
  info.classList.remove('hidden')
  for (const item of crucialData) {
    let dataContainer = document.createElement('div')
    let headerContainer = document.createElement('div')
    let author = document.createElement('img')
    author.classList.add('avatar')
    author.src = item.authors[0].avatar
    dataContainer.classList.add('crucialItem')
    let header = document.createElement('h2')
    headerContainer.append(header)
    headerContainer.append(author)
    header.textContent = item.title
    headerContainer.classList.add('crucialHeader')
    dataContainer.append(headerContainer)
    const content = document.createElement('div')
    content.innerHTML = item.content_html
    dataContainer.append(content)
    container.appendChild(dataContainer)
  }
}

const getTracks = async (page) => {
  const path = window.location.pathname
  if (path.includes('crucial')) {
    const data = await fetch(`https://www.crucialtracks.org/profile/pxplowsound/feed.json?page=${page}&per_page=5`)
    const crucialData = await data.json()
    return {data: crucialData.items,  totalPages: crucialData._pagination.pages}
  }
}

export const init = async () => {
  const { data, totalPages } = await getTracks(currentPage)
  displayTracks(data)
  placeButtons(currentPage, totalPages)
}
