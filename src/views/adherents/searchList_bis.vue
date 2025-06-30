<template>
    <main>
  <div
      class="relative flex size-full min-h-screen flex-col bg-gray-50 group/design-root overflow-x-hidden"
      style='--select-button-svg: url(&apos;data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724px%27 height=%2724px%27 fill=%27rgb(100,112,130)%27 viewBox=%270 0 256 256%27%3e%3cpath d=%27M181.66,170.34a8,8,0,0,1,0,11.32l-48,48a8,8,0,0,1-11.32,0l-48-48a8,8,0,0,1,11.32-11.32L128,212.69l42.34-42.35A8,8,0,0,1,181.66,170.34Zm-96-84.68L128,43.31l42.34,42.35a8,8,0,0,0,11.32-11.32l-48-48a8,8,0,0,0-11.32,0l-48,48A8,8,0,0,0,85.66,85.66Z%27%3e%3c/path%3e%3c/svg%3e&apos;); font-family: "Plus Jakarta Sans", "Noto Sans", sans-serif;'
    >
      <div class="layout-container flex h-full grow flex-col">
        <header class="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#ebedef] px-10 py-3">
          <div class="flex items-center gap-8">
            <div class="flex items-center gap-4 text-[#121417]">
              <div class="size-4">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z"
                    fill="currentColor"
                  ></path>
                </svg>
              </div>
              <h2 class="text-[#121417] text-lg font-bold leading-tight tracking-[-0.015em]">FanFusion</h2>
            </div>
            <div class="flex items-center gap-9">
              <a class="text-[#121417] text-sm font-medium leading-normal" href="#">Home</a>
              <a class="text-[#121417] text-sm font-medium leading-normal" href="#">Explore</a>
              <a class="text-[#121417] text-sm font-medium leading-normal" href="#">Sell</a>
              <a class="text-[#121417] text-sm font-medium leading-normal" href="#">Community</a>
            </div>
          </div>
          <div class="flex flex-1 justify-end gap-8">
            <label class="flex flex-col min-w-40 !h-10 max-w-64">
              <div class="flex w-full flex-1 items-stretch rounded-lg h-full">
                <div
                  class="text-[#647082] flex border-none bg-[#ebedef] items-center justify-center pl-4 rounded-l-lg border-r-0"
                  data-icon="MagnifyingGlass"
                  data-size="24px"
                  data-weight="regular"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                    <path
                      d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"
                    ></path>
                  </svg>
                </div>
                <input
                  placeholder="Search"
                  class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#121417] focus:outline-0 focus:ring-0 border-none bg-[#ebedef] focus:border-none h-full placeholder:text-[#647082] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                  value=""
                />
              </div>
            </label>
            <button
              class="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#ebedef] text-[#121417] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5"
            >
              <div class="text-[#121417]" data-icon="Bell" data-size="20px" data-weight="regular">
                <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
                  <path
                    d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"
                  ></path>
                </svg>
              </div>
            </button>
            <div
              class="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
              style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuC_0VbcP9alq-HxEXLR0aQjAue_2KF-HASk_0aPBTkEKWsPK5427q1na8gi6YJSycYLIsMZc789t8o0-ALptZHaJggaMw-NHSTeefpnLVzt80sn4o88ZOF7-eaSHVkkmZkzlbaG9EoYXyYldKTgUF7UcZSZ1slRAp3Mp2K14KUoXRXKhrHkIAoEBJzrural71U65rPcpxTCh6iC1pOnq6zLkgKlPYvwk8qnFLKNG8oaqivyIf1Jv8hxlctgUg0WuSbdnpV1lNg75a4");'
            ></div>
          </div>
        </header>
        <div class="gap-1 px-6 flex flex-1 justify-center py-5">
          <div class="layout-content-container flex flex-col w-80">
            <h3 class="text-[#121417] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Filters</h3>
            <div class="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label class="flex flex-col min-w-40 flex-1">
                <select
                  class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#121417] focus:outline-0 focus:ring-0 border border-[#d7dbe0] bg-gray-50 focus:border-[#d7dbe0] h-14 bg-[image:--select-button-svg] placeholder:text-[#647082] p-[15px] text-base font-normal leading-normal"
                >
                  <option value="one">All Groups</option>
                  <option value="two">two</option>
                  <option value="three">three</option>
                </select>
              </label>
            </div>
            <div class="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label class="flex flex-col min-w-40 flex-1">
                <select
                  class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#121417] focus:outline-0 focus:ring-0 border border-[#d7dbe0] bg-gray-50 focus:border-[#d7dbe0] h-14 bg-[image:--select-button-svg] placeholder:text-[#647082] p-[15px] text-base font-normal leading-normal"
                >
                  <option value="one">All Members</option>
                  <option value="two">two</option>
                  <option value="three">three</option>
                </select>
              </label>
            </div>
            <div class="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label class="flex flex-col min-w-40 flex-1">
                <select
                  class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#121417] focus:outline-0 focus:ring-0 border border-[#d7dbe0] bg-gray-50 focus:border-[#d7dbe0] h-14 bg-[image:--select-button-svg] placeholder:text-[#647082] p-[15px] text-base font-normal leading-normal"
                >
                  <option value="one">All Conditions</option>
                  <option value="two">two</option>
                  <option value="three">three</option>
                </select>
              </label>
            </div>
            <div class="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label class="flex flex-col min-w-40 flex-1">
                <select
                  class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#121417] focus:outline-0 focus:ring-0 border border-[#d7dbe0] bg-gray-50 focus:border-[#d7dbe0] h-14 bg-[image:--select-button-svg] placeholder:text-[#647082] p-[15px] text-base font-normal leading-normal"
                >
                  <option value="one">All Prices</option>
                  <option value="two">two</option>
                  <option value="three">three</option>
                </select>
              </label>
            </div>
            <div class="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label class="flex flex-col min-w-40 flex-1">
                <select
                  class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#121417] focus:outline-0 focus:ring-0 border border-[#d7dbe0] bg-gray-50 focus:border-[#d7dbe0] h-14 bg-[image:--select-button-svg] placeholder:text-[#647082] p-[15px] text-base font-normal leading-normal"
                >
                  <option value="one">All Shipping Options</option>
                  <option value="two">two</option>
                  <option value="three">three</option>
                </select>
              </label>
            </div>
            <div class="flex px-4 py-3">
              <button
                class="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 flex-1 bg-[#161f2c] text-gray-50 text-sm font-bold leading-normal tracking-[0.015em]"
              >
                <span class="truncate">Apply Filters</span>
              </button>
            </div>
          </div>
          <div class="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div class="px-4 py-3">
              <label class="flex flex-col min-w-40 h-12 w-full">
                <div class="flex w-full flex-1 items-stretch rounded-lg h-full">
                  <div
                    class="text-[#647082] flex border-none bg-[#ebedef] items-center justify-center pl-4 rounded-l-lg border-r-0"
                    data-icon="MagnifyingGlass"
                    data-size="24px"
                    data-weight="regular"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path
                        d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"
                      ></path>
                    </svg>
                  </div>
                  <input
                    class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#121417] focus:outline-0 focus:ring-0 border-none bg-[#ebedef] focus:border-none h-full placeholder:text-[#647082] px-4 rounded-r-none border-r-0 pr-2 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                    value="Search for photocards..."
                  />
                  <div class="flex items-center justify-center rounded-r-lg border-l-0 border-none bg-[#ebedef] pr-2 pr-4">
                    <button
                      class="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-transparent text-[#121417] gap-2 text-base font-bold leading-normal tracking-[0.015em] h-auto min-w-0 px-0"
                    >
                      <div class="text-[#647082]" data-icon="XCircle" data-size="24px" data-weight="regular">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                          <path
                            d="M165.66,101.66,139.31,128l26.35,26.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"
                          ></path>
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
              </label>
            </div>
            <h2 class="text-[#121417] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Search Results</h2>
            <div class="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
              <div class="flex flex-col gap-3 pb-3">
                <div
                  class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg"
                  style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuAP0CUDZTPFC-aDihy4EYgYVIpRiDvNeKShODjM6zEVjj4XGvAVJvpqZrhI1oq225d2KeW_42HOL0UBZGchzzrj2l1anGijAec0sG1uabJYdVEKRTFmC29vEHQ4OxVqC6vm0E2rdqUJzk5te_beBYh16vyZGdnk0HVjCj2VEyLnhe6Q4PzyCGe8n6XgSxM4j9JsNDaPrjHH5iooBAOEhrN6z-jkyzZK2vJgAdnFdmVheUro_0IsBNkuLOKS8wprg6JxP1UlpYYings");'
                ></div>
                <div>
                  <p class="text-[#121417] text-base font-medium leading-normal">Olivia Kim Photocard</p>
                  <p class="text-[#647082] text-sm font-normal leading-normal">$15 • Group A • Olivia Kim</p>
                </div>
              </div>
              <div class="flex flex-col gap-3 pb-3">
                <div
                  class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg"
                  style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuBadVKW9gZIhLCd-olfuUfRsg9KJ0M7J4KG4ywZFFiv5SIX7kpi6JkA_lBecQfYy6bI1zphm4ou3ufQv5FIcOdF2uJ7e1fcmhJJyXftv3awhWD-3brSTsOVqKI73JnJNKr1Giaptb2fS1HDIJJ7OqBD1gUUgxRT4ZINqB-jbCPaJDgsiJ6Fuq-j7bOWOjmPZ76SfukC6VNa_hp9BClRk3VE5VJp4TFQrpU3DL6NySpCXmoBoEqx_ReCTKV43kjV0icPCkRj9_whoPU");'
                ></div>
                <div>
                  <p class="text-[#121417] text-base font-medium leading-normal">Ethan Lee Photocard</p>
                  <p class="text-[#647082] text-sm font-normal leading-normal">$12 • Group B • Ethan Lee</p>
                </div>
              </div>
              <div class="flex flex-col gap-3 pb-3">
                <div
                  class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg"
                  style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuANpeREg5__X21hOGCi3hhcUyuiLrWRp-8Lt7SKNwG_nlKz1VmoDOtEhP9ohG7LqRdOlllqqXHXwes97X-w2661N6NdtZNNEPTzVOn0dqI-zZXxBo2jQWuC__AYNBEUFMKN7kG7cHMvJnKuBgEMGKil7u9XARWjN8N8wTdGusB0BXQcgs9_llPzLtbe0eE-gA0SymDIGcm1HZjWMdQE-ittgUsSrNp-4E98JYrEs1aoXXRIM2USTfopDYQpB57H17ll6d5FHXJkAj0");'
                ></div>
                <div>
                  <p class="text-[#121417] text-base font-medium leading-normal">Sophia Park Photocard</p>
                  <p class="text-[#647082] text-sm font-normal leading-normal">$18 • Group C • Sophia Park</p>
                </div>
              </div>
              <div class="flex flex-col gap-3 pb-3">
                <div
                  class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg"
                  style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuAJa834M-zk_yuIpmLn9-TL3LDCQk5pxOG1ukA4UrSpY7_DQYI4IzaseKr2hUejoKZfRtq1rR9iEZOUNGs0vzgOPKwojiuHWB6KU4qaKcxBTNe1lxV2j1cnWqqnF7T5wYImlUpj059bOhtrREmMyc0PBYHJexrwOa24vPSgAyM3M8fUwFpbYKUYOAYyiftNz6AeWwyRW793zebb7ca4tvxCyAJffZsxZq-KD27o0wFLrItBeW8Ip2n6PwDA6rKFDdXK4JTcFjfVF_I");'
                ></div>
                <div>
                  <p class="text-[#121417] text-base font-medium leading-normal">Noah Choi Photocard</p>
                  <p class="text-[#647082] text-sm font-normal leading-normal">$10 • Group D • Noah Choi</p>
                </div>
              </div>
              <div class="flex flex-col gap-3 pb-3">
                <div
                  class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg"
                  style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuDITRLHhfNvQAR4qiPu5KjIvpn0jgyEW6I-l2N2jspz9L-UW_gXLMurX1haIah540ch9tjuuYOTQcz_hZlWnvflX8yXseKJdJydwrRSMr4I2nREeWjgot7m0qy9tbk6EAXtNuSbA3fP_LjzCqqbA_9wh1TfiNuN705FY5g_WTQnL5j0zpj_aqf2XrIAVBjzGSr8-UpWdGQQa-p-i-8gO-seg241bd45Qd-xscO2r1t8ECGvG6YeNTdqJ6H6MzR34I046yB4fIwLZAs");'
                ></div>
                <div>
                  <p class="text-[#121417] text-base font-medium leading-normal">Ava Kim Photocard</p>
                  <p class="text-[#647082] text-sm font-normal leading-normal">$14 • Group A • Ava Kim</p>
                </div>
              </div>
              <div class="flex flex-col gap-3 pb-3">
                <div
                  class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg"
                  style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuCH1clKAtCtWofDFuA-GOYHvEBhRwzyYmf_h8CNb2qwVfpTnYw1dScO87p22iPpA2Iq0D0eTt8axdEkNoP0C2Qjb2XxKZvfqKPxJmMcZC52GBXcHJaV-Y-9plKhujZ_4VlZhLs3urU0OrcvA3WVcD24MDGAMsAPpY7oMoWS3jZiPCIW24-DJjGcz3A05XuZs7SGSydvc6Rn6P2wxG3bwdY-dCXnomTRpSczhCzy_92EdRqdGO8sF5SlAtWSdgAJBO4_IYNSnjQUTUg");'
                ></div>
                <div>
                  <p class="text-[#121417] text-base font-medium leading-normal">Liam Lee Photocard</p>
                  <p class="text-[#647082] text-sm font-normal leading-normal">$11 • Group B • Liam Lee</p>
                </div>
              </div>
              <div class="flex flex-col gap-3 pb-3">
                <div
                  class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg"
                  style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuA7iXEIexCyIC2CjKYUso1HC6BPrw8CE4iv0gMDdOKyExeS9CctOk7otWIE9ewzgJmv04Hmjjp3HYJo0Fxy3sLATLoF6g9Axr-dGROgZlnmiIbGeedhgOU8L3ineCnmlRhMafvVBj-L3AliwwGiXHxuyFYYWarZOgQzNCWD_K5gS4ZEIqsgCHPI_2kOcdMXhynYhmrTOzHudGry6PzVS2S5jhIflTs9OMJXyLKFr5fy3elSi0lgz24V7-eJjxJEEfhHOu0HdfDu4Os");'
                ></div>
                <div>
                  <p class="text-[#121417] text-base font-medium leading-normal">Chloe Park Photocard</p>
                  <p class="text-[#647082] text-sm font-normal leading-normal">$17 • Group C • Chloe Park</p>
                </div>
              </div>
              <div class="flex flex-col gap-3 pb-3">
                <div
                  class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg"
                  style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuDS2lYJ3klEEicjL4eE8dckLE4TefZ5DIGZzLrD5F6efBKWjZuWuoGnv77eAZdAVJQkushTnxd2-3yMBE02CsxoBMlfRCoLamE9_Bpmzvt8qxoiXFASzmF8rInc_NX71S0tXTYVZeryY0VnPdDXSD-BFDmFezBTWFernYlbdohthFI6n_Ql7U5oSwB9Dr7ohVZMUwcHI8eRkntGwReYpsUfqITbS_CyN4Pq-8ItROxxWi9ouZgzRVPUvuTPY38xkDndMTjU5GS0qW4");'
                ></div>
                <div>
                  <p class="text-[#121417] text-base font-medium leading-normal">Owen Choi Photocard</p>
                  <p class="text-[#647082] text-sm font-normal leading-normal">$9 • Group D • Owen Choi</p>
                </div>
              </div>
              <div class="flex flex-col gap-3 pb-3">
                <div
                  class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg"
                  style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuCYnkwIQytzj2O_x7bqtSVsg2tGpCdr0WTgiWZrVF77JO22rQJbyajj09OuzbLK-9eHAEYLjfdz6FYx-DB_hyfiDM86iK-87YVQybmqFSy3_LI1YxmAj3kA9XIkhXvZVnwUxPRjUWLyo5ti9oo_j_8b9XaE_WA7CPiKpOXyBIEI9yLtz8tWSuh6x05qaYuvaGsw-ra3AaQxWPxVNRk7XJj4F3kkaUM_aDdsiYGO3x_YR2aMQOXzL82NYZcB9WNEmS-pmPRYW56JXLo");'
                ></div>
                <div>
                  <p class="text-[#121417] text-base font-medium leading-normal">Mia Kim Photocard</p>
                  <p class="text-[#647082] text-sm font-normal leading-normal">$16 • Group A • Mia Kim</p>
                </div>
              </div>
              <div class="flex flex-col gap-3 pb-3">
                <div
                  class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg"
                  style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuA3zJ-7iIz38tphISakjEc_EDdz41PQouMeQVyZ8bh5tImh6aO_JLUwEeObrXISKNaGPSlDNz1elhb6TgmzwAZvKfzqrM_P374aWocM2f1jUcKfFDajDGf3N_yp1Qj5IhshQQ1p8pV43ZksQrfy1N8KrBl2BHBNbuCShOmC2lb7LL6JXvT8yAQ4Vv1I86NFK78xbxetb_8GxrsyglCQOFOgGweQ0lqTyXYyvcGmquHx6P-wzgm7AG6zgXFUTFQUCS5bDXfLMsfX4Po");'
                ></div>
                <div>
                  <p class="text-[#121417] text-base font-medium leading-normal">Lucas Lee Photocard</p>
                  <p class="text-[#647082] text-sm font-normal leading-normal">$13 • Group B • Lucas Lee</p>
                </div>
              </div>
              <div class="flex flex-col gap-3 pb-3">
                <div
                  class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg"
                  style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuC1-7svPPhD4JC7H401P4vseU1Ngl48bmJWZWQ0olePN73Bczi-804nwvxc-DSHCCKIY4V6Nnjid9DrciAkIX58SPiEMr7ToaHe46j1HMzBv7-hEyGdVYGxolITH8Mt8_frRJF8yr12JodDo7ijrkYusTCjlBsfrwd4dhUQ3IwTl3M9Y9w5vGlaOkEjZTFYdQjhTuviJL9liMo95cGlzItewJQQaB-KDH2XPaIsYvzVyEI6r84DXyZd9zXPO3FOrxYkM2mjoL7wTHs");'
                ></div>
                <div>
                  <p class="text-[#121417] text-base font-medium leading-normal">Ella Park Photocard</p>
                  <p class="text-[#647082] text-sm font-normal leading-normal">$19 • Group C • Ella Park</p>
                </div>
              </div>
              <div class="flex flex-col gap-3 pb-3">
                <div
                  class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg"
                  style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuBeoDW9aSRXsno8Assu34TnaFxz7St2LpkYRfkhP2cP0MBeBsUlLzQ1JZ50pjdpyN-wiTC_RvtgE1qBUFfsxHEKhm4Uo-gBY5ktaYdhtG-jwwonVNj60yUpwJtHYWnnDjQFIJsLMiPfofX6e3g4bgqenhkflYQDZtJox2Apihar6ltN-sPoGnLCl-TitU_GceryHCMW6mrv4gkfUOuUJtDMUAzBoOpabAjmuT8xPquACgLxeB6fcvLEk93OfcwdB4ZwJ1RuTqt0uH8");'
                ></div>
                <div>
                  <p class="text-[#121417] text-base font-medium leading-normal">Caleb Choi Photocard</p>
                  <p class="text-[#647082] text-sm font-normal leading-normal">$8 • Group D • Caleb Choi</p>
                </div>
              </div>
            </div>
            <div class="flex items-center justify-center p-4">
              <a href="#" class="flex size-10 items-center justify-center">
                <div class="text-[#121417]" data-icon="CaretLeft" data-size="18px" data-weight="regular">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"></path>
                  </svg>
                </div>
              </a>
              <a class="text-sm font-bold leading-normal tracking-[0.015em] flex size-10 items-center justify-center text-[#121417] rounded-full bg-[#ebedef]" href="#">1</a>
              <a class="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#121417] rounded-full" href="#">2</a>
              <a class="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#121417] rounded-full" href="#">3</a>
              <a class="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#121417] rounded-full" href="#">4</a>
              <a class="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#121417] rounded-full" href="#">5</a>
              <a href="#" class="flex size-10 items-center justify-center">
                <div class="text-[#121417]" data-icon="CaretRight" data-size="18px" data-weight="regular">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
                  </svg>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    </main>
  </template>
  
  <script lang="ts">
    import { defineComponent, ref } from 'vue';
    import { useRoute } from 'vue-router';
    import postService from '../../services/post.js';

    import Nav_bar from '@/components/adherents/nav_bar.vue';
    import Popup_add_item from '@/components/adherents/popup_add_item.vue';
    import search_bar_2 from '@/components/search_bar_2.vue';
    

  export default defineComponent({
    name: 'searchList_bis',
    components: {
      Nav_bar,
      Popup_add_item,
      search_bar_2
    },
    props: {

    },
    data() {
      return {
        posts: [] as Array<{
          condition: any;
          isAvailable: any;
          id: number;
          title: string;
          state: string;
          price: number;
          isReserved: boolean;
          images: string[];
        }>,
        pagination: {
          limit: 10,
          page: 1
        },
        isPopupVisible: false
      };

    },
    created() {
      const route = useRoute();
      const postsStr = route.query.posts_str || '[]';
      const pagination_str = route.query.pagination_str || '[]';
      const event = route.query.event || '';
      if(event !=''){
        if(event === 'morePage') {
          this.loadMore(); // Affiche la popup si l'événement est 'add'
        }
      }

      this.posts = JSON.parse(postsStr as string);
      this.pagination = JSON.parse(pagination_str as string);
    },
    methods: {
      showPopup() {
        this.isPopupVisible = true; // Affiche la popup
      },
      loadMore(){
        this.pagination.page++;
        postService.getPosts(this.pagination.limit, this.pagination.page).then((postsServiceItems) => {
          postsServiceItems.products.forEach((postsServiceItem: { condition: any; isAvailable: any; id: number; title: string; state: string; price: number; isReserved: boolean; images: string[]; }) => {
            this.posts.push(postsServiceItem);
          });
        }).catch((error) => {
          console.error('Erreur lors de la récupération des posts:', error);
        });
      }
    },
  })
  </script>
  
<style lang="scss" scoped>
/* Reset de base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: var(--color-background);
  color: var(--color-text);
  line-height: 1.6;
}

.container {
  display: flex;
  gap: 2rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Sidebar */
.sidebar {
  flex: 0 0 260px;
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}

.sidebar select,
.sidebar button {
  width: 100%;
  padding: 0.6rem 0.8rem;
  margin-bottom: 1rem;
  font-size: 1rem;
  border: 1px solid var(--color-tint);
  border-radius: 6px;
}

.sidebar button {
  background-color: var(--color-primary);
  color: white;
  font-weight: bold;
  cursor: pointer;
}

/* Main content */
.main-content {
  flex: 1;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
}

.search-bar input {
  flex: 1;
  padding: 0.7rem 1rem;
  border: 1px solid var(--color-tint);
  border-radius: 8px;
}

/* Results grid */
.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  padding: 0.5rem;
  box-shadow: 0 0 4px rgba(0,0,0,0.05);
  transition: box-shadow 0.2s ease;
  text-align: center;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.card img {
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.card .name {
  font-weight: bold;
  margin-top: 0.5rem;
}

.card .info {
  font-size: 0.875rem;
  color: var(--color-secondary);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.pagination button {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  border: none;
  background: white;
  cursor: pointer;
}

.pagination button.active {
  background: var(--color-accent);
  color: white;
  font-weight: bold;
}


</style>
  