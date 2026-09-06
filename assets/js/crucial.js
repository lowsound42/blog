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
     const { data, totalPages } = await getTracks(currentPage)
     window.history.pushState({ page: currentPage }, "", `${window.location.pathname}?page=${currentPage}`)
     displayTracks(data)
     container.classList.remove('fade-out')
     placeButtons(currentPage, totalPages)
     window.scrollTo({ top: 200, behavior: 'smooth' })
    })
    nextButton.addEventListener('click', async () => {
      const container = document.getElementById('crucialContainer')
      container.classList.add('fade-out')
      await new Promise(r => setTimeout(r, 300))
      currentPage++
      const { data, totalPages } = await getTracks(currentPage)
      window.history.pushState({ page: currentPage }, "", `${window.location.pathname}?page=${currentPage}`)
      displayTracks(data)
      container.classList.remove('fade-out')
      placeButtons(currentPage, totalPages)
      window.scrollTo({ top: 200, behavior: 'smooth' })
    })
  const pageCount = document.createElement('span')
  pageCount.innerText = `page ${currentPage} of ${totalPages}`
  buttonHolder.append(prevButton)
  buttonHolder.append(nextButton)
  if (Number(currentPage) === 1) {
    prevButton.disabled = true
    prevButton.classList.add('disabled')
  }
  if (Number(currentPage) === totalPages) {
    nextButton.disabled = true
    nextButton.classList.add('disabled')
  }
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
    let artwork = document.createElement('img')
    artwork.src = item._song_details.artwork_url;
    author.classList.add('avatar')
    author.src = item.authors[0].avatar
    dataContainer.classList.add('crucialItem')
    let header = document.createElement('h3')
    headerContainer.append(author)
    headerContainer.append(header)
    const dateStr = item.title.slice(18);
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);

    header.textContent = `${item.title.slice(0, 18)} ${formattedDate}`;

    headerContainer.classList.add('crucialHeader')
    dataContainer.append(headerContainer)
    dataContainer.append(artwork)
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

const pageChecker = (page, totalPages) => {
  if (
    page > totalPages || page < 1 || isNaN(Number(page))
  ) {
    window.location = `/crucial?page=1`;
  }
}

export const init = async () => {
  window.addEventListener('popstate', async (e) => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page') || 1;
    const { data, totalPages } = await getTracks(page);
    pageChecker(page, totalPages)
    displayTracks(data);
    placeButtons(page, totalPages);
    window.scrollTo({ top: 200, behavior: 'smooth' })
  });
  if (window.location.pathname.includes('crucial')) {
    const urlParams = new URLSearchParams(window.location.search);
    let page = null
    page = urlParams.get('page')
    if (!page) {
      page = 1
      window.history.replaceState(null,
                              "", `/crucial?page=${page}`);
    }
    const { data, totalPages } = await getTracks(page)
    pageChecker(page, totalPages)
    displayTracks(data)
    placeButtons(page, totalPages)
  }
}
