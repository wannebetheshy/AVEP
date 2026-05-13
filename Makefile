dev:
	docker compose -f docker-compose.dev.yml up --build

prod:
	docker compose -f docker-compose.prod.yml up --build

test:
	@status=0; \
	docker compose -f docker-compose.yml run --rm backend pytest tests/test_db.py; \
	status=$$?; \
	docker compose -f docker-compose.yml down; \
	exit $$status

proxy-build:
	export CLASH_HTTP=http://172.17.0.1:7890; \
	export CLASH_SOCKS=socks5://172.17.0.1:7890; \
	docker compose -f docker-compose.yml build \
	  --build-arg HTTP_PROXY=$$CLASH_HTTP \
	  --build-arg HTTPS_PROXY=$$CLASH_HTTP \
	  --build-arg ALL_PROXY=$$CLASH_SOCKS

proxy-build-prod:
	export CLASH_HTTP=http://172.17.0.1:7890; \
	export CLASH_SOCKS=socks5://172.17.0.1:7890; \
	docker compose -f docker-compose.prod.yml build \
	  --build-arg HTTP_PROXY=$$CLASH_HTTP \
	  --build-arg HTTPS_PROXY=$$CLASH_HTTP \
	  --build-arg ALL_PROXY=$$CLASH_SOCKS

