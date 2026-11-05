sed -i '/cron:/d' .github/workflows/jules-autonomous-factory.yml
sed -i 's/- name: Render Batch Shorts\/Reels/# - name: Render Batch Shorts\/Reels/' .github/workflows/jules-autonomous-factory.yml
sed -i 's/run: python3 jules_engine\/batch_reels.py/# run: python3 jules_engine\/batch_reels.py/' .github/workflows/jules-autonomous-factory.yml
sed -i 's/- name: Render Mega Video/# - name: Render Mega Video/' .github/workflows/jules-autonomous-factory.yml
sed -i 's/run: python3 jules_engine\/make_mega_video.py/# run: python3 jules_engine\/make_mega_video.py/' .github/workflows/jules-autonomous-factory.yml
sed -i 's/- name: Schedule & Drip Publish/# - name: Schedule & Drip Publish/' .github/workflows/jules-autonomous-factory.yml
sed -i 's/run: python3 jules_engine\/scheduler.py/# run: python3 jules_engine\/scheduler.py/' .github/workflows/jules-autonomous-factory.yml
