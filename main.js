class PrayerWall extends HTMLElement {
    constructor() {
        super();
        this.prayerRequests = [];

        const prayerFormContainer = document.createElement('div');
            prayerFormContainer.id = 'prayer-form-container';
            prayerFormContainer.innerHTML = `
                <form id="prayer-form">
                    <label for="Author_Name" class="required">Name:</label>
                    <input type="text" name="Author_Name" id="Author_Name" required>
                    <label for="Author_Email" class="required">Email:</label>
                    <input type="email" name="Author_Email" id="Author_Email" required>
                    <label for="Author_Phone">Phone Number:</label>
                    <input type="tel" name="Author_Phone" id="Author_Phone">
                    <label for="Prayer_Title">Prayer Title:</label>
                    <input type="text" name="Prayer_Title" id="Prayer_Title">
                    <label for="Prayer_Body" class="required">Prayer Body:</label>
                    <textarea name="Prayer_Body" id="Prayer_Body" required></textarea>
                    <label for="Private">Private:</label>
                    <input type="checkbox" name="Private" id="Private">
                    <button type="submit">submit</button>
                </form>
            `

        const loadingIconDOM = document.createElement('div');
            loadingIconDOM.classList.add('loading');
            loadingIconDOM.innerHTML = '<div class="lds-spinner"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>'

        this.prayersContainer = document.createElement('div');
        this.prayersContainer.id = 'prayers-container';

        this.appendChild(prayerFormContainer)
        this.appendChild(this.prayersContainer)
        this.appendChild(loadingIconDOM)

        const prayerFormDOM = document.getElementById('prayer-form');
            prayerFormDOM.onsubmit = this.handleSubmit

        this.update();
    }

    handleScroll = () => {
        const container = document.getElementById('prayers-container')
        const bottom = container.offsetHeight - window.innerHeight;
        if (window.scrollY < bottom) return;
        console.log('you\'re at the bottom of the page')

        //disabled load more so it doesn't run multiple times
        document.removeEventListener('scroll', this.handleScroll)

        this.update();
    }

    update = async () => {
        // for (let i = 0; i < prayers.length; i++) {
        //     const {Author_Name, Author_Email, Author_Phone, Date_Created, Prayer_Body} = prayers[i];
        //     const currPrayer = {
        //         Author_Name: Author_Name,
        //         Author_Email: Author_Email,
        //         Author_Phone: Author_Phone,
        //         Date_Created: new Date(Date_Created).toISOString(),
        //         Prayer_Title: null,
        //         Prayer_Body: Prayer_Body,
        //         Prayer_Status_ID: 2,
        //         Prayer_Count: 1,
        //         Private: false
        //     }
        //     console.log(`sending prayer by: ${Author_Name}`)
        //     await this.post(currPrayer)
        // }
        const data = await axios({
            method: 'get',
            url: `http://localhost:3000/api/prayer-wall?skip=${this.prayerRequests.length}`
        })
            .then(response => response.data)
        const {prayer_requests} = data;
        this.prayerRequests = this.prayerRequests.concat(prayer_requests);
        if (!prayer_requests.length) {
            const loader = document.querySelector('.loading');
            loader.style.display = 'none';
            loader.style.visibility = 'hidden';
            return;
        } else if (prayer_requests.length <  18) {
            const loader = document.querySelector('.loading');
            loader.style.display = 'none';
            loader.style.visibility = 'hidden';
        }
        

        for (let i = 0; i < prayer_requests.length; i ++) {
            const {Author_Name, Date_Created, Prayer_Title, Prayer_Body, Prayer_Count, Prayer_Request_ID} = prayer_requests[i];
            
            const prayerCard = document.createElement('div');
                prayerCard.id = `prayer-${Prayer_Request_ID}`;
                prayerCard.classList.add('prayer-card')
                prayerCard.innerHTML = `
                    <h2 class="name">${Author_Name || 'Anonymous'}</h2>
                    <p class="date">${new Date(Date_Created).toLocaleDateString('en-us', {weekday:"long", year:"numeric", month:"short", day:"numeric"})}</p>
                    <div class="prayer-body">
                        ${Prayer_Title ? `<p class="prayer-title">${Prayer_Title}</p>` : ''}
                        <p class="prayer">${Prayer_Body.replace('\n', '</br>')}</p>
                    </div>
                    <p class="prayer-count" ${!Prayer_Count ? 'style="visibility: hidden;"' : ''}>prayed for ${Prayer_Count} ${Prayer_Count == 1 ? 'time' : 'times'}</p>
                    <button id="pray-btn-${Prayer_Request_ID}" class="pray-btn">I prayed for this</button>
                `
            this.prayersContainer.appendChild(prayerCard)
            const prayBtn = document.getElementById(`pray-btn-${Prayer_Request_ID}`)

            prayBtn.onclick = () => this.prayed(Prayer_Request_ID)

            //enabled load more when user reaches page bottom
            document.addEventListener('scroll', this.handleScroll)
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
            <h2 class="name">${Author_Name || 'Anonymous'}</h2>
            <p class="date">${new Date(Date_Created).toLocaleDateString('en-us', {weekday:"long", year:"numeric", month:"short", day:"numeric"})}</p>
            <div class="prayer-body">
                ${Prayer_Title ? `<p class="prayer-title">${Prayer_Title}</p>` : ''}
                <p class="prayer">${Prayer_Body.replace('\n', '</br>')}</p>
            </div>
            <p class="prayer-count" ${!Prayer_Count ? 'style="visibility: hidden;"' : ''}>prayed for ${Prayer_Count} ${Prayer_Count == 1 ? 'time' : 'times'}</p>
            <button disabled id="pray-btn-${Prayer_Request_ID}" class="pray-btn">I prayed for this</button>
        `
    }
    handleSubmit = async (e) => {
        e.preventDefault();
        const authorNameValue = document.getElementById('Author_Name').value
        const authorEmailValue = document.getElementById('Author_Email').value
        const authorPhoneValue = document.getElementById('Author_Phone').value
        const prayerTitleValue = document.getElementById('Prayer_Title').value
        const prayerBodyValue = document.getElementById('Prayer_Body').value
        const privateValue = document.getElementById('Private').checked

        const prayer = {
            Author_Name: authorNameValue,
            Author_Email: authorEmailValue,
            Author_Phone: authorPhoneValue,
            Date_Created: new Date().toISOString(),
            Prayer_Title: prayerTitleValue,
            Prayer_Body: prayerBodyValue,
            Prayer_Status_ID: 1,
            Prayer_Count: 0,
            Private: privateValue
        }
        await this.post(prayer)
    }
    post = async (prayer) => {
        await axios({
            method: 'post',
            url: 'http://localhost:3000/api/prayer-wall',
            data: prayer
        })
        .then(response => console.log(response))
        .catch(err => console.error(err))
    }
}

customElements.define("prayer-wall", PrayerWall);