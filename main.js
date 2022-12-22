console.log(prayers)


class PrayerWall extends HTMLElement {
    constructor() {
        super();
        document.addEventListener('scroll', () => {
            const bottom = this.offsetHeight - window.innerHeight;
            if (window.scrollY < bottom) return;
            
            this.update();
        })
        this.prayerRequests = [];


        const loadingIconDOM = document.createElement('div');
            loadingIconDOM.classList.add('lds-spinner');
            loadingIconDOM.innerHTML = '<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>'
            this.appendChild(loadingIconDOM)
        this.prayersContainer = document.createElement('div');
        this.prayersContainer.id = 'prayers-container';
        this.appendChild(this.prayersContainer)
        this.update();
    }

    update = async () => {
        console.log(`skipping ${this.prayerRequests.length}`)
        const data = await axios({
            method: 'get',
            url: `http://localhost:3000/api/prayer-wall?skip=${this.prayerRequests.length}`
        })
            .then(response => response.data)
        const {prayer_requests} = data;
        this.prayerRequests = this.prayerRequests.concat(prayer_requests);
        if (!prayer_requests.length) return 'no more';
        

        for (let i = 0; i < prayer_requests.length; i ++) {
            const {Author_Name, Date_Created, Prayer_Title, Prayer_Body, Prayer_Count, Prayer_Request_ID} = prayer_requests[i];
            
            const prayerCard = document.createElement('div');
                prayerCard.id = `prayer-${Prayer_Request_ID}`;
                prayerCard.classList.add('prayer-card')
                prayerCard.innerHTML = `
                    <h2 class="name">${Author_Name}</h2>
                    <p class="date">${new Date(Date_Created).toLocaleDateString('en-us', {weekday:"long", year:"numeric", month:"short", day:"numeric"})}</p>
                    <div class="prayer-body">
                        <p class="prayer-title">${Prayer_Title}</p>
                        <p class="prayer">${Prayer_Body}</p>
                    </div>
                    <p class="prayer-count" ${!Prayer_Count ? 'style="visibility: hidden;"' : ''}>prayed for ${Prayer_Count} ${Prayer_Count == 1 ? 'time' : 'times'}</p>
                    <button id="pray-btn-${Prayer_Request_ID}" class="pray-btn">I prayed for this</button>
                `
            this.prayersContainer.appendChild(prayerCard)
            const prayBtn = document.getElementById(`pray-btn-${Prayer_Request_ID}`)

            prayBtn.onclick = () => this.prayed(Prayer_Request_ID)
        }
    }
    prayed = async (id) => {
        const prayBtn = document.getElementById(`pray-btn-${id}`)
            prayBtn.disabled = true
        const data = await axios({
            method: 'get',
            url: `http://localhost:3000/api/prayer-wall/${id}`
        })
        .then(response => response.data)
        const {prayer_request: prayerRequest} = data;
        prayerRequest.Prayer_Count ++;

        await axios({
            method: 'put',
            url: `http://localhost:3000/api/prayer-wall`,
            data: prayerRequest
        })
        .then(response => response.data)
        .catch(err => console.error(err))

        const {Author_Name, Date_Created, Prayer_Title, Prayer_Body, Prayer_Count, Prayer_Request_ID} = prayerRequest;
        const currPrayerCard = document.getElementById(`prayer-${id}`);
        currPrayerCard.innerHTML = `
            <h2 class="name">${Author_Name}</h2>
            <p class="date">${new Date(Date_Created).toLocaleDateString('en-us', {weekday:"long", year:"numeric", month:"short", day:"numeric"})}</p>
            <div class="prayer-body">
                <p class="prayer-title">${Prayer_Title}</p>
                <p class="prayer">${Prayer_Body}</p>
            </div>
            <p class="prayer-count" ${!Prayer_Count ? 'style="visibility: hidden;"' : ''}>prayed for ${Prayer_Count} ${Prayer_Count == 1 ? 'time' : 'times'}</p>
            <button disabled id="pray-btn-${Prayer_Request_ID}" class="pray-btn">I prayed for this</button>
        `
    }
}

customElements.define("prayer-wall", PrayerWall);